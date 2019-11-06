import { action, observable } from 'mobx';
import { Color, Config, shuffle, DevivationPath,SensitiveInfo, sendToast, callApi, convertHexToDecimal } from '../extension/AppInit';
import HDKey from 'hdkey';
const ethUtil = require('ethereumjs-util');
import bip39 from 'react-native-bip39'
import AsyncStorage from '@react-native-community/async-storage';
import AccountInfoContext from '../context/AccountInfoContext';
import {showMessage} from "react-native-flash-message";
import axios from 'axios'
import abiArray from '../contractabi/tokenabi.json'
import settingStore from './SettingStore';
import languageStore from './LanguageStore';
const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
import moment from 'moment';
import intl from 'react-intl-universal';
import { toJS } from 'mobx';
import iWanUtils from '../utils/iwanUtils';
var wanTx = require('wanchain-util').wanchainTx;

class WalletStore {
  @observable basicCompleteSave = () => null;
  @observable walletlist = [];
  @observable reloadWallet = ()=> null;
  @observable reloadSparkLine = ()=> null;
  @observable resetHomeBeforeLoadWallet = ()=> null;
  @observable skipStore = false;
  @observable fromManageWallet = false;
  @observable reloadManageWallet = ()=> null;
  @observable homeSelectedWallet = ()=> null;
  @observable primaryTokenAsset = [];
  @observable allTokenAsset = [];

  @action setSkipStore = (status) =>{
    this.skipStore = status;
  }

  @action setFromManageWallet = (status) =>{
    this.fromManageWallet = status;
  }

  @action setReloadWallet = (load) =>{
    this.reloadWallet = load;
  }

  @action setReloadManageWallet = (load) =>{
    this.reloadManageWallet = load;
  }

  @action setHomeBeforeLoadWallet = (load) =>{
    this.resetHomeBeforeLoadWallet = load;
  }

  @action setReloadSparkLine = (load) =>{
    this.reloadSparkLine = load;
  }

  @action setWallets = (walletlist) =>{
    this.walletlist = walletlist;
  }

  @action setHomeSelectedWallet = (func) =>{
    this.homeSelectedWallet = func;
  }

  @action generate12SeedPhase = async(cb) => {
    let selectedwordlist = bip39.wordlists.DEFAULT_WORDLIST;
    if(languageStore.language == "zh_CN") selectedwordlist = bip39.wordlists.Chinese_Simplified;
    if(languageStore.language == "zh_TW") selectedwordlist = bip39.wordlists.Chinese_Traditional;
    await bip39.generateMnemonic(null,null,selectedwordlist).then((mnemonic)=>{
      cb(mnemonic);
    });
  }

  @action getCurrentGasPrices = async () => {
    let response = await axios.get("https://ethgasstation.info/json/ethgasAPI.json");

    let prices = {
      low : response.data.safeLow,
      medium : response.data.average,
      high : 45
    }
    return prices;
  }

  @action TransferETH = async(selectedWallet,selectedToken,recipientaddress,setamount,cb,cberror) =>{
    console.log(selectedToken)
    if(selectedToken.TokenType == "eth"){
      const web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
      var from = selectedToken.PublicAddress;
      var targetaddr = recipientaddress;
      var amountToSend = setamount;
      let gasPrices = await this.getCurrentGasPrices();
      var nonce = 0;

      web3.eth.getTransactionCount(from).then(txCount => {
        nonce = txCount++;
        let details = {
          "from": from,
          "to": targetaddr,
          "value": web3.utils.toHex( web3.utils.toWei(amountToSend, 'ether') ),
          "gas": 21000,
          "gasPrice": gasPrices.high * 1000000000, 
          "nonce": nonce,
          "chainId": settingStore.selectedETHNetwork.chainid
        }

        var transaction = settingStore.selectedETHNetwork.shortcode == "mainnet" ? new Tx(details) : new Tx(details, {chain:settingStore.selectedETHNetwork.shortcode, hardfork: 'petersburg'});
        // const transaction = new Tx(details, {chain:settingStore.oldnetwork.shortcode, hardfork: 'petersburg'});
        transaction.sign(Buffer.from(selectedToken.PrivateAddress, 'hex'))
        const serializedTransaction = transaction.serialize()
        web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, hash) => {
          if (!err){ //SUCCESS
              console.log("success", hash);
              cb(hash);
          }else{
              console.log(err);
              cberror(err);
          }
        });
      });
    }else if(selectedToken.TokenType == "wan"){
      const web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
      var TokenInfo = selectedToken.TokenInfoList.find(x => x.Network == settingStore.selectedWANNetwork.shortcode);
      var abiArray = JSON.parse(TokenInfo.AbiArray);
      var receiver = recipientaddress;//"0x8859C2BE1a9D6Fbe37E1Ed58c103487eE7B8b90F";

      iWanUtils.getNonce("WAN", from).then(async (res) =>  {
        if (res && Object.keys(res).length) {
          var nonce = res;
          try{
            iWanUtils.getGasPrice("WAN").then(async (gas) =>  {
              var gasprice = gas;
              var rawTransaction = {
                "from": from,
                "nonce": nonce,
                "gasPrice": 180000000000,//gasprice,// * 1000,//"0x737be7600",//gasPrices.high * 100000000,//"0x04e3b29200",
                "gas": '0x35B60',//"0x5208",//"0x7458",
                "gasLimit": '0x35B60',//web3.utils.toHex("519990"),//"0x7458",
                "Txtype": "0x01",
                "to": receiver,
                "value": web3.utils.toHex( web3.utils.toWei(amountToSend, 'ether') ),
                "chainId": settingStore.selectedWANNetwork.chainid
              };
              console.log("trx raw", rawTransaction);
              var privKey = new Buffer(selectedToken.PrivateAddress,'hex');//"35e0ec8f5d689f370cdc9c35a04d1664c9316aadbd2ac508cfa69f3de7aaa233", 'hex');
              var tx = new wanTx(rawTransaction);
              tx.sign(privKey);

              var serializedTx = tx.serialize();
              iWanUtils.sendRawTransaction("WAN", '0x' + serializedTx.toString('hex')).then(hash => {
                console.log("success", hash);
                cb(hash);         
              }).catch(err => {
                console.log(err);
                cberror(err);
              });
            }).catch(err => {
              console.log(err);
            });
          }catch(e){}
        }
      }).catch(err => {
        console.log(err);
      });
    }else if(selectedToken.TokenType == "wrc20"){
      const web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
      var TokenInfo = selectedToken.TokenInfoList.find(x => x.Network == settingStore.selectedWANNetwork.shortcode);
      var abiArray = JSON.parse(TokenInfo.AbiArray);
      
      var contractdata = new web3.eth.Contract(abiArray, TokenInfo.ContractAddress);
      var receiver = recipientaddress;//"0x8859C2BE1a9D6Fbe37E1Ed58c103487eE7B8b90F";

      iWanUtils.getNonce("WAN", selectedToken.PublicAddress).then(async (res) =>  {
        if (res && Object.keys(res).length) {
          var nonce = res;
          try{
            iWanUtils.getGasPrice("WAN").then(async (gas) =>  {
              var gasprice = gas;

              var data = web3.eth.abi.encodeFunctionCall({
                name: 'transfer',
                type: 'function',
                inputs: [{
                  name: "recipient",
                  type: "address"
                }, {
                  name: "amount",
                  type: "uint256"
                }]
              }, [receiver, web3.utils.toWei(amountToSend, 'ether')]);

              var rawTransaction = {
                "from": selectedToken.PublicAddress,
                "nonce": nonce,
                "gasPrice": 180000000000,//gasprice,// * 1000,//"0x737be7600",//gasPrices.high * 100000000,//"0x04e3b29200",
                "gas": '0x35B60',//"0x5208",//"0x7458",
                "gasLimit": '0x35B60',//web3.utils.toHex("519990"),//"0x7458",
                "Txtype": "0x01",
                "to": TokenInfo.ContractAddress,//this.tokencontract,
                "value": "0x0",//web3.utils.toHex(web3.utils.toWei(this.state.tokenval, 'ether')),
                "data": data, //contractdata.methods.transfer(receiver,10).encodeABI(),//data, 
                "chainId": settingStore.selectedWANNetwork.chainid//"0x03" //1 mainnet
              };
              console.log("trx raw", rawTransaction);
              var privKey = new Buffer(selectedToken.PrivateAddress,'hex');//"35e0ec8f5d689f370cdc9c35a04d1664c9316aadbd2ac508cfa69f3de7aaa233", 'hex');
              var tx = new wanTx(rawTransaction);
              tx.sign(privKey);

              var serializedTx = tx.serialize();
              iWanUtils.sendRawTransaction("WAN", '0x' + serializedTx.toString('hex')).then(hash => {
                console.log("success", hash);
                cb(hash);                      
              }).catch(err => {
                console.log(err);
                cberror(err);
              });
            }).catch(err => {
              console.log(err);
            });
          }catch(e){}
        }
      }).catch(err => {
        console.log(err);
      });
    }else if(selectedToken.TokenType == "erc20"){
      const web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
      var TokenInfo = selectedToken.TokenInfoList[0];
      var count = await web3.eth.getTransactionCount(selectedToken.PublicAddress ,'pending');
      var gasPrices = await this.getCurrentGasPrices();
      var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
      var contractdata = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
      // var contractdata = new web3.eth.Contract(abiArray, settingStore.oldnetwork.contractaddr);
      var rawTransaction = {
          "from": selectedToken.PublicAddress,
          "nonce": count,
          "gasPrice": gasPrices.high * 100000000,
          "gas": web3.utils.toHex("519990"),
          "gasLimit":web3.utils.toHex("519990"),
          "to": TokenInfo.ContractAddress,
          "value": "0x0",
          "data": contractdata.methods.transfer(recipientaddress,web3.utils.toWei(new Web3.utils.BN(setamount), 'ether')).encodeABI(),
          "chainId": settingStore.selectedETHNetwork.chainid
      };
      // console.log(rawTransaction);
      var privKey = new Buffer(selectedToken.PrivateAddress,'hex');
      var tx = settingStore.selectedETHNetwork.shortcode == "mainnet" ? new Tx(rawTransaction) : new Tx(rawTransaction,{'chain': settingStore.selectedETHNetwork.shortcode});
      tx.sign(privKey);
      var serializedTx = tx.serialize();
      web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), (err, hash) =>{
        if (!err){ //SUCCESS
            console.log("success", hash);
            cb(hash);
        }else{
            console.log(err);
            cberror(err);
        }
      }); 
    }
  }

  @action createETHAddress = async(accinfoId,newwalletname,seedval,totalowners,totalsignatures,wallettype, isCloud) =>{
    if(seedval.split(" ").length != 12){
      showMessage({
        message: intl.get('Alert.InvalidLengthOfMnemonicePhrase'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    // var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed(seedval));
    // const derivepath = DevivationPath.ETH;
    // const addrNode = hdkey.derive(derivepath);   
    // const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
    // const addr = ethUtil.publicToAddress(pubKey).toString('hex');
    // const address = ethUtil.toChecksumAddress(addr);

    //personal write - mok
    // const addr = this.publicToAddress(pubKey).toString('hex');
    // const address = this.toChecksumAddress(addr);
    // console.log(address);


    const derivepath = DevivationPath.ETH;
    const walletkey = await this.GenerateBIP39Address(derivepath + "0", seedval);
    const privateaddress = walletkey.privateaddress;
    const publicaddress = walletkey.publicaddress;

    this.SaveETHWallet(accinfoId,accinfoId,newwalletname,seedval,privateaddress,derivepath,publicaddress,"eth",totalowners,totalsignatures,wallettype,isCloud);
  }

  @action CreateETHAddressByPrivateKey(accinfoId,newwalletname,privatekey,totalowners,totalsignatures,wallettype,isCloud){
    if(privatekey == ""){
      showMessage({
        message: intl.get('Error.InvalidPrivateKey'),
        type: "warning",
        icon:"warning",
        // autoHide:false
      });
      return;
    }
    try{
      const seedval = "";
      const derivepath = DevivationPath.ETH;
      var privateaddress = new Buffer(privatekey, 'hex');
      const pubKey = ethUtil.privateToPublic(privateaddress);
      const addr = ethUtil.publicToAddress(pubKey).toString('hex');
      const address = ethUtil.toChecksumAddress(addr);
      this.publicaddress = address;
      // this.SaveWallet(this.walletname,seedval,this.restoreprivatekey.toString('hex'),derivepath,address,"eth",this.selectedwallettype,0,0);
      this.SaveETHWallet(accinfoId,accinfoId,newwalletname,seedval,privatekey.toString('hex'),derivepath,address,"eth",totalowners,totalsignatures,wallettype,isCloud);
    }catch(e){
      console.log(e);
      showMessage({
        message: intl.get('Error.InvalidPrivateKey'),
        type: "warning",
        icon:"warning",
        // autoHide:false
      });
    }
  }

  @action CreateBasicWallet = (acctoken,walletinfo,cb,cberror) =>{
    // console.log(acctoken,walletinfo)
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletname', walletinfo.walletname);
    formdata.append('seedphase', walletinfo.seedphase);
    formdata.append('privatekey', walletinfo.privatekey);
    formdata.append('derivepath', walletinfo.derivepath);
    formdata.append('publicaddress', walletinfo.publicaddress);
    formdata.append('addresstype', walletinfo.addresstype);
    formdata.append('network', settingStore.selectedETHNetwork.shortcode);
    callApi("api/multisig/CreateBasicWallet",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }


  @action createMultiSigWallet = (acctoken,walletinfo,cb,cberror) =>{
    // console.log(acctoken,walletinfo)
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletname', walletinfo.walletname);
    formdata.append('seedphase', walletinfo.seedphase);
    formdata.append('privatekey', walletinfo.privatekey);
    formdata.append('derivepath', walletinfo.derivepath);
    formdata.append('publicaddress', walletinfo.publicaddress);
    formdata.append('addresstype', walletinfo.addresstype);
    formdata.append('totalowners', walletinfo.totalowners);
    formdata.append('totalsignatures', walletinfo.totalsignatures);
    formdata.append('network', settingStore.selectedETHNetwork.shortcode);
    callApi("api/multisig/CreateMultiSigWallet",formdata, async(response)=>{
      console.log("CreateMultiSigWallet", response);
      if(response.status == 200){
        var tokenassetlist = await this.insertPrimaryAssetTokenList(walletinfo.seedphase,true,walletinfo.publicaddress,walletinfo.privatekey)
        this.InsertTokenAssetToCloudWallet(acctoken,walletinfo.publicaddress, tokenassetlist,(cbresponse)=>{
          cb(cbresponse);
        },(cbresponse)=>{
          cberror(cbresponse);
        });
      }
    },(response)=>{
      console.log("CreateMultiSigWallet", response);
      cberror(response);
    });
  }

  @action joinMultiSigWallet = (accinfoId,acctoken,pubaddress,cb,cberror) =>{
    // console.log(accinfoId,acctoken,pubaddress)
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', pubaddress);
    formdata.append('network', "");
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    callApi("api/multisig/JoinMultiSigWallet",formdata,(response)=>{
      if(response.status == 200){
        this.basicCompleteSave = () => cb(wallet);
        var wallet = response.wallet;
        this.setSkipStore(false);
        // // this.SaveWallet(wallet.WalletName,wallet.Seedphase,wallet.PrivateAddress,wallet.DerivePath,wallet.PublicAddress,wallet.AddressType,"Shared",wallet.NumbersOfOwners,wallet.NumbersOfSigners);
        this.SaveETHWallet(accinfoId,wallet.OwnerId,wallet.WalletName,wallet.Seedphase,wallet.PrivateAddress,wallet.DerivePath,wallet.PublicAddress,wallet.AddressType,wallet.NumbersOfOwners,wallet.NumbersOfSigners,"Shared",true);
      }else{
        cberror(response);
      }
    },(response)=>{
      cberror(response);
    });
  }

  @action createMultiSigTransaction = (acctoken,fromwalletpublicaddress,towalletpublicaddress,totaltoken,selectedToken,cb,cberror) =>{
    var network = settingStore.selectedETHNetwork.shortcode;
    if(selectedToken.TokenType == "wan" || selectedToken.TokenType == "wrc20"){
      network = settingStore.selectedWANNetwork.shortcode;
    }

    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('fromwalletpublicaddress', fromwalletpublicaddress);
    formdata.append('senderpublicaddress', selectedToken.PublicAddress); // new
    formdata.append('towalletpublicaddress', towalletpublicaddress);
    formdata.append('totaltoken', totaltoken);
    formdata.append('assetcode', selectedToken.AssetCode); // new
    formdata.append('network', network);
    callApi("api/multisig/CreateTrx",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  SaveETHWallet = async (accinfoId,ownerId,walletname,seedphase,privatekey,derivepath,publicaddress,addresstype,totalowners,totalsignatures,wallettype,isCloud) =>{
    // console.log("this.primaryTokenAsset", JSON.stringify(this.primaryTokenAsset))
    let walletlist = [];
    try {
      let newwallet = {
        walletname:walletname,
        userid : accinfoId,
        seedphase : seedphase,
        privatekey : privatekey,
        derivepath : derivepath,
        publicaddress : publicaddress,
        addresstype : addresstype,
        totalowners: parseInt(totalowners),
        totalsignatures: parseInt(totalsignatures),
        wallettype:wallettype,
        rvx_balance:0,
        // network:settingStore.oldnetwork.shortcode,
        ownerid:ownerId,
        isOwner:ownerId == accinfoId,
        // primaryTokenAsset:[],
        // otherTokenAsset:[],
        tokenassetlist:await this.insertPrimaryAssetTokenList(seedphase,isCloud,publicaddress,privatekey),
        isCloud:isCloud
      };
      if(this.skipStore){
        console.log("From Cloud")
        this.basicCompleteSave(newwallet);
      }else{
        console.log("From Device")
        const value = await AsyncStorage.getItem('@wallet');
        if(value !== null) {
          walletlist = JSON.parse(value);
        }
        console.log("before", walletlist);
        // console.log("before userid ", settingStore.accinfo.Id);
        //have to double make sure not insert twice
        if(walletlist.some(x => x.publicaddress == publicaddress && x.userid == settingStore.accinfo.Id) === false ){
          walletlist.push(newwallet);
          console.log("after", walletlist);
          try {
            await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
              this.basicCompleteSave(newwallet);
              // console.log("walletStore.fromManageWallet", JSON.stringify(walletStore.walletlist));
              if(walletStore.fromManageWallet){
                walletStore.setWallets(walletlist);
                walletStore.reloadManageWallet();
                walletStore.setFromManageWallet(false);
              }
            });
          } catch (e) {
            // saving error
          }
        }else{
          showMessage({
            message: intl.get('Alert.WalletAlreadyExist'),
            type: "warning",
            icon:"warning",
            // autoHide:false
          });
        }
      }
    } catch(e) {
      console.log(e);
      // error reading value
    }
  }

  insertPrimaryAssetTokenList = async (seedphase,iscloud,defaultpublicaddress,defaultprivatekey) =>{
    console.log(seedphase,iscloud,defaultpublicaddress,defaultprivatekey)
    if(this.primaryTokenAsset.length > 0){
      var promises = this.primaryTokenAsset.map(async (tokenitem,index)=>{
        var derivepath = DevivationPath.ETH;
        if(tokenitem.TokenType == "wan" || tokenitem.TokenType == "wrc20"){
          derivepath = DevivationPath.WAN;
        }

        if(seedphase != ""){
          var walletkey = await this.GenerateBIP39Address(derivepath + "0",seedphase);
          tokenitem.PublicAddress = walletkey.publicaddress;
          tokenitem.PrivateAddress = walletkey.privateaddress;
        }else{
          tokenitem.PublicAddress = defaultpublicaddress;
          tokenitem.PrivateAddress = defaultprivatekey;
        }
        return tokenitem;
      });

      const results = await Promise.all(promises);
      return toJS(results);
    }else{
      return [];
    }
  }

  async GenerateBIP39Address(derivepath,seedval){
    var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed(seedval));
    const addrNode = hdkey.derive(derivepath);   
    const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
    const addr = ethUtil.publicToAddress(pubKey).toString('hex');
    const publicaddress = ethUtil.toChecksumAddress(addr);
    const privateaddress = addrNode._privateKey.toString('hex');

    return {publicaddress:publicaddress, privateaddress:privateaddress};
  }


  @action saveETHWalletToStorage = async(newwallet,cb) =>{
    const value = await AsyncStorage.getItem('@wallet');
      let walletlist = [];
      if(value !== null) {
        walletlist = JSON.parse(value);
      }
      //have to double make sure not insert twice
      if(walletlist.some(x => x.publicaddress == newwallet.publicaddress) === false){
        walletlist.push(newwallet);
        try {
          await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
            cb(newwallet);
          });
        } catch (e) {
          // saving error
        }
      }else{
        showMessage({
          message: intl.get('Alert.WalletAlreadyExist'),
          type: "warning",
          icon:"warning",
          // autoHide:false
        });
      }
  }

  // @action requestTransferOTP = (acctoken,cb) =>{
  //   var formdata = new FormData();
  //   formdata.append('token', acctoken);
  //   formdata.append('smsnotification', this.props.settingStore.acctoken);
  //   callApi("api/auth/RequestTransferTokenOTP",formdata,(response)=>{
  //     cb(response);
  //   });
  // }

  ParseTrxStatus(status){
    if(status == "0"){
      return "Failed";
    }else{
      return "Success";
    }
  }

  FormatTransactionByAddress(tokentype,item){
    var trx = {
      trxid : item.hash,
      from : item.from,
      to : item.to,
      block : item.blockNumber,
      // gasprice : item.gasPrice,
      // gasused : item.gasUsed,
      gasprice :(tokentype == "wrc20" || tokentype == "wan") ? (item.gasPrice/1000000000) + " gwin" : (item.gasPrice/1000000000) + " gwei",
      gasused : (tokentype == "wrc20" || tokentype == "wan") ? (item.gas/1000000000) + " gwin" : (item.gasUsed/1000000000) + " gwei",
      nonce : item.nonce,
      timestamp : item.timeStamp,
      value : Web3.utils.fromWei(item.value, 'ether'),
      confirmation : item.confirmations,
      status : this.ParseTrxStatus(item.txreceipt_status),
      isblockchain : true,
      action : "",
      signers : []
    }

    return trx;
  }

  @action LoadTransactionByAddress(tokentype,publicaddress,cb,cberror){
    // console.log(`${settingStore.oldnetwork.etherscanendpoint}?module=account&action=txlist&address=${publicaddress}&sort=desc&apikey=${SensitiveInfo.etherscanAPIKey}`);
    if(tokentype == "erc20" || tokentype == "eth"){
      axios({
        method: 'post',
        // url: 'http://api.etherscan.io/api?module=account&action=txlist&address=' + publicaddress + '&sort=desc&apikey=' + SensitiveInfo.etherscanAPIKey,
        url: `${settingStore.selectedETHNetwork.etherscanendpoint}?module=account&action=txlist&address=${publicaddress}&sort=desc&apikey=${SensitiveInfo.etherscanAPIKey}`,      
        data: {}
      })
      .then((response) =>{
        // console.log("LoadTransactionByAddress" + response)
        if(response.data.result.length > 0){
          var finallist = [];
          response.data.result.map((item, i) =>
          {
            var tokenvalueinhex = item.input.slice(-32);
            if(tokentype == "erc20"){
              item.value = convertHexToDecimal(tokenvalueinhex);
            }
            var trx = this.FormatTransactionByAddress(tokentype,item);
            
            finallist.push(trx);
          });
          finallist = finallist.filter(x => x.value != 0);
          cb(finallist);
        }else{
          cb(response.data.result);
        }
      })
      .catch((response) =>{
          //handle error
          console.log(response);
      });
    }else if(tokentype == "wrc20" || tokentype == "wan"){
      iWanUtils.getTransByAddress("WAN",publicaddress).then(response => {
        if(response == null) response = [];
        if(response.length > 0){
          var finallist = [];
          response.map((item, i) =>
          {
            var tokenvalueinhex = item.input.slice(-32);
            if(tokentype == "wrc20"){
              item.value = convertHexToDecimal(tokenvalueinhex);
            }
            var trx = this.FormatTransactionByAddress(tokentype,item);
            
            finallist.push(trx);
          });
          finallist = finallist.filter(x => x.value != 0);
          cb(finallist);
        }else{
          cb(response);
        }
      })
      .catch(function (response) {
        //handle error
        console.log(response);
      });
    }
  }

  @action LoadMultiSigTransactionByAddress(acctoken,walletpublicaddress,selectedToken,cb,cberror){
    var network = settingStore.selectedETHNetwork.shortcode;
    if(selectedToken.TokenType == "wan" || selectedToken.TokenType == "wrc20"){
      network = settingStore.selectedWANNetwork.shortcode;
    }
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', walletpublicaddress);
    formdata.append('senderpublicaddress', selectedToken.PublicAddress); // new
    formdata.append('assetcode', selectedToken.AssetCode); // new
    formdata.append('network', network);

    callApi("api/multisig/GetMultiSigTrxByWalletPublicAddress",formdata,(response)=>{
      if(response.trx.length > 0){
        var finallist = [];
        response.trx.map((item, i) =>
        {
          console.log(item.dt)

          var action = "Approve";
          var signers = JSON.parse(JSON.stringify(item.Signers));
          // console.log("SIGNERS",signers);
          
          if(signers.some(x => x.UserId == settingStore.accinfo.Id)){ //SIGNED 
            action = "Approved"
          }

          if(item.Status == "Completed") action = "Completed";

          var trx = {
            trxid : item.TrxId,
            from : item.FromWalletPublicAddress,
            to : item.ToWalletPublicAddress,
            block : "",
            gasprice : 0,
            gasused : 0,
            nonce : 0,
            timestamp : moment.utc(item.dt).unix(),//settingStore.getUnixTime(new Date(item.dt)),
            value : item.Total,
            confirmation : 0,
            status : item.Status,
            isblockchain : false,
            action : action,
            signers : signers
          }

          finallist.push(trx);
        });
        cb(finallist); //trx
      }else{
        cb(response.trx); //trx
      }
    },(response)=>{
      cberror(response);
    });
  }

  @action approveMultiSigTransaction(acctoken, trxid, selectedWallet,selectedToken,recipientaddress,setamount,execute,cb,cberror){
    console.log(acctoken, trxid, selectedWallet,recipientaddress,setamount,execute);
    if(execute){
      this.TransferETH(selectedWallet,selectedToken,recipientaddress,setamount,(response)=>{
        cb(response);
        this.updateCompletedMultiSignTrx(acctoken, trxid, selectedToken, false);
      },cberror);
    }else{
      this.updateCompletedMultiSignTrx(acctoken, trxid , selectedToken, true);
    }
  }

  @action updateCompletedMultiSignTrx(acctoken, trxid, selectedToken, isredirect){
    var network = settingStore.selectedETHNetwork.shortcode;
    if(selectedToken.TokenType == "wan" || selectedToken.TokenType == "wrc20"){
      network = settingStore.selectedWANNetwork.shortcode;
    }
    var formdata = new FormData();
    formdata.append('trxhash', trxid);
    formdata.append('token', acctoken);
    formdata.append('network', network);
    callApi("api/multisig/ApproveTrx",formdata,(response)=>{
      console.log(response);
      if(isredirect){
        console.log("isredirect");
      }
    },(response)=>{
      console.log(response);
    });
  }

  @action getTokenSparkLineByAssetCode(acctoken, crypto, cb, cberror){
    var formdata = new FormData();
    formdata.append('crypto', crypto);
    formdata.append('token', acctoken);
    console.log(acctoken)
    callApi("api/token/GetTokenSparkLine",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action GetCloudWalletByUserId(acctoken, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('network', "");
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    callApi("api/multisig/GetCloudWalletByUserId",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  // @action GetCloudWalletByPublicAddress(acctoken, publicaddress, cb, cberror){
  //   var formdata = new FormData();
  //   formdata.append('token', acctoken);
  //   formdata.append('walletpublicaddress', publicaddress);
  //   formdata.append('network', settingStore.oldnetwork.shortcode);
  //   callApi("api/multisig/GetCloudWalletByPublicAddress",formdata,(response)=>{
  //     cb(response);
  //   },(response)=>{
  //     cberror(response);
  //   });
  // }

  @action ExitMultiSigWallet(acctoken, publicaddress, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', publicaddress);
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    console.log(acctoken)
    callApi("api/multisig/ExitMultiSigWallet",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action RemoveMultiSigWallet(acctoken, publicaddress, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', publicaddress);
    formdata.append('network', "");
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    // console.log(acctoken)
    callApi("api/multisig/RemoveMultiSigWallet",formdata,(response)=>{
      console.log("RemoveMultiSigWallet", response)
      cb(response);
    },(response)=>{
      console.log("RemoveMultiSigWallet", response)
      cberror(response);
    });
  }

  @action GetPrimaryTokenAssetByNetwork(acctoken, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    formdata.append('ethnetwork', settingStore.selectedETHNetwork.shortcode);
    formdata.append('wannetwork', settingStore.selectedWANNetwork.shortcode);
    callApi("api/token/GetPrimaryTokenAssetByNetwork",formdata,(response)=>{
      console.log(response)
      if(response.status == 200){
        // let primaryTokenAssetResult = [];
        // if(response.tokenassetlist.length > 0){
        //   response.tokenassetlist.map((item,index)=>{
        //     item.Network = settingStore.oldnetwork.shortcode;
        //     primaryTokenAssetResult.push(item);
        //   })
        // }
        // this.primaryTokenAsset = primaryTokenAssetResult;
        this.primaryTokenAsset = response.tokenassetlist;
      }
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }
  
  @action GetAllTokenAssetByNetwork(acctoken, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    formdata.append('ethnetwork', settingStore.selectedETHNetwork.shortcode);
    formdata.append('wannetwork', settingStore.selectedWANNetwork.shortcode);
    callApi("api/token/GetAllTokenAssetByNetwork",formdata,(response)=>{
      console.log("GetAllTokenAssetByNetwork", response)
      if(response.status == 200){
        // let allTokenAssetResult = [];
        // if(response.tokenassetlist.length > 0){
        //   response.tokenassetlist.map((item,index)=>{
        //     // item.Network = settingStore.oldnetwork.shortcode;
        //     allTokenAssetResult.push(item);
        //   })
        // }
        // this.allTokenAsset = allTokenAssetResult;
        this.allTokenAsset = response.tokenassetlist;
      }
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action InsertTokenAssetToCloudWallet(acctoken, publicaddress, tokenassetlist, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('publicaddress', publicaddress);
    formdata.append('tokenassetlist', JSON.stringify(tokenassetlist));
    // formdata.append('shortcode', shortcode);
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    callApi("api/token/InsertTokenAssetToCloudWallet",formdata,(response)=>{
      console.log(response)
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action RemoveTokenAssetInCloudWallet(acctoken, publicaddress, shortcode, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('publicaddress', publicaddress);
    formdata.append('shortcode', shortcode);
    // formdata.append('network', settingStore.oldnetwork.shortcode);
    callApi("api/token/RemoveTokenAssetInCloudWallet",formdata,(response)=>{
      console.log(response)
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  // axios({
  //   method: 'post',
  //   url: 'http://rvx.boxybanana.com/api/multisig/ApproveTrx',
  //   data: bodyFormData,
  //   config: { headers: {'Content-Type': 'multipart/form-data' }}
  // })
  // .then(function (response) {
  //   console.log(response);
  //   if(response.data.status == 200){
  //     if(isredirect){
  //       console.log(response.data);
  //       self.setsuccessulhash(response.data.trx.TrxId);
  //       self.setCurrent("tokentransfersuccessful");
  //     }
  //   }else{
  //     createNotification('error',intl.get("Error." + response.data.msg));
  //   }
  // })
  // .catch(function (response) {
  //     //handle error
  //     console.log(response);
  //     createNotification('error',intl.get("Error." + response.data.msg));
  // });

  // @action getWalletTokenValue(val){
  //   return Web3.utils.fromWei(new Web3.utils.BN(val), 'ether');
  // }

  getTokenPrice = (assetcode,tokentype) => {
    // console.log(assetcode,tokentype)
    // var price = 0;
    // this.allTokenAsset.map(async(token,index) => {
    //   console.log("getTokenPrice", token.AssetCode,token.TokenType,token.CurrentPrice);
    //   console.log("getTokenPrice", assetcode,tokentype)
    //   if(token.AssetCode == assetcode && token.TokenType == tokentype) price = token.CurrentPrice;
    // });
    let selectedAsset = this.allTokenAsset.find(x => x.AssetCode.toLowerCase() == assetcode.toLowerCase() && x.TokenType.toLowerCase() == tokentype.toLowerCase());
    return selectedAsset.CurrentPrice;
  }

  loadTokenAssetList = (selectedwallet) =>{
    console.log(toJS(settingStore.selectedETHNetwork),toJS(settingStore.selectedWANNetwork))
    return new Promise((resolve,reject) =>{
      let totalget = 0;
      let totalassetworth = 0;
      selectedwallet.tokenassetlist.map(async(tokenitem,index) =>{
        if(tokenitem.TokenType == "eth"){
          var web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
          web3.eth.getBalance(tokenitem.PublicAddress).then(balance => { 
            balance = parseFloat(balance) / (10**18);
            tokenitem.TokenBalance = balance;
            tokenitem.TokenPrice = this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType);
            totalassetworth += (this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType) * tokenitem.TokenBalance);
            totalget++;
            if(totalget == selectedwallet.tokenassetlist.length){
              selectedwallet.totalassetworth = totalassetworth;
              resolve(toJS(selectedwallet));
            }
          })
        }else if(tokenitem.TokenType == "erc20"){
          var web3 = new Web3(settingStore.selectedETHNetwork.infuraendpoint);
          var TokenInfo = tokenitem.TokenInfoList.find(x => x.Network == settingStore.selectedETHNetwork.shortcode);
          TokenInfo = toJS(TokenInfo);
          var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
          // Get ERC20 Token contract instance
          let contract = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
          web3.eth.call({
            to: !isNullOrEmpty(TokenInfo.ContractAddress) ? TokenInfo.ContractAddress : null,
            data: contract.methods.balanceOf(tokenitem.PublicAddress).encodeABI()
          }).then(balance => {  
            balance = balance / (10**18);
            tokenitem.TokenBalance = balance;
            tokenitem.TokenPrice = this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType);
            totalassetworth += (this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType) * tokenitem.TokenBalance);
            totalget++;
            if(totalget == selectedwallet.tokenassetlist.length){
              selectedwallet.totalassetworth = totalassetworth;
              resolve(toJS(selectedwallet));
            }
          });
          self.selectedassettokenlist.push(tokenitem);
        }else if(tokenitem.TokenType == "wrc20"){
          var TokenInfo = tokenitem.TokenInfoList.find(x => x.Network == settingStore.selectedWANNetwork.shortcode);
          TokenInfo = toJS(TokenInfo);
          iWanUtils.getWrc20Balance("WAN",tokenitem.PublicAddress,tokenitem.TokenInfoList[0].ContractAddress).then(res => {
            if (res && Object.keys(res).length) {
              try{
                var balance = res;
                tokenitem.TokenBalance = parseFloat(balance) / (10**18);
                tokenitem.TokenPrice = this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType);
                totalassetworth += (this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType) * tokenitem.TokenBalance);
                // self.selectedassettokenlist.push(tokenitem);
                totalget++;
                if(totalget == selectedwallet.tokenassetlist.length){
                  selectedwallet.totalassetworth = totalassetworth;
                  resolve(toJS(selectedwallet));
                }
              }catch(e){
                console.log("wrc20", e)
              }
            }
          }).catch(err => {
            console.log(err);
          });
        }else if(tokenitem.TokenType == "wan"){
          var TokenInfo = tokenitem.TokenInfoList.find(x => x.Network == settingStore.selectedWANNetwork.shortcode);
          TokenInfo = toJS(TokenInfo);
          iWanUtils.getBalance("WAN",tokenitem.PublicAddress).then(res => {
            if (res && Object.keys(res).length) {
              try{
                var balance = res;
                tokenitem.TokenBalance = parseFloat(balance) / (10**18);
                tokenitem.TokenPrice = this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType);
                totalassetworth += (this.getTokenPrice(tokenitem.AssetCode,tokenitem.TokenType) * tokenitem.TokenBalance);
                // self.selectedassettokenlist.push(tokenitem);
                totalget++;
                if(totalget == selectedwallet.tokenassetlist.length){
                  console.log("last");
                  selectedwallet.totalassetworth = totalassetworth;
                  resolve(toJS(selectedwallet));
                }
              }catch(e){
                console.log("wan", e)
              }
            }
          }).catch(err => {
            console.log(err);
          })
        }
      });
    });
  }

  // loadTokenAssetList = async(selectedwallet) =>{
    

  //   const results = await Promise.all(selectedwallet);
  //   console.log("_loadTokenAssetList 3",results);
  //   return toJS(results);
  // }
}

const walletStore = new WalletStore();
export default walletStore;
// https://itnext.io/easily-integrate-mobx-into-react-native-app-with-expo-and-react-navigation-29ecf7c14012