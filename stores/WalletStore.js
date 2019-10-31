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
    const web3 = new Web3(settingStore.selectedBlockchainNetwork.infuraendpoint); 
    if(selectedToken.TokenType == "eth"){
      var from = selectedWallet.publicaddress;
      var targetaddr = recipientaddress;
      var amountToSend = setamount;
      let gasPrices = await this.getCurrentGasPrices();

      web3.eth.getTransactionCount(from).then(txCount => {
        nonce = txCount++;
        let details = {
          "from": from,
          "to": targetaddr,
          "value": web3.utils.toHex( web3.utils.toWei(amountToSend, 'ether') ),
          "gas": 21000,
          "gasPrice": gasPrices.high * 1000000000, 
          "nonce": nonce,
          "chainId": settingStore.selectedBlockchainNetwork.chainid
        }

        var transaction = settingStore.selectedBlockchainNetwork.shortcode == "mainnet" ? new Tx(details) : new Tx(details, {chain:settingStore.selectedBlockchainNetwork.shortcode, hardfork: 'petersburg'});
        // const transaction = new Tx(details, {chain:settingStore.selectedBlockchainNetwork.shortcode, hardfork: 'petersburg'});
        transaction.sign(Buffer.from(selectedWallet.privatekey, 'hex'))
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
    }else{
      var TokenInfo = selectedToken.TokenInfoList[0];
      var count = await web3.eth.getTransactionCount(selectedWallet.publicaddress ,'pending');
      var gasPrices = await this.getCurrentGasPrices();
      var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
      var contractdata = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
      // var contractdata = new web3.eth.Contract(abiArray, settingStore.selectedBlockchainNetwork.contractaddr);
      var rawTransaction = {
          "from": selectedWallet.publicaddress,
          "nonce": count,
          "gasPrice": gasPrices.high * 100000000,
          "gas": web3.utils.toHex("519990"),
          "gasLimit":web3.utils.toHex("519990"),
          "to": TokenInfo.ContractAddress,
          "value": "0x0",
          "data": contractdata.methods.transfer(recipientaddress,web3.utils.toWei(new Web3.utils.BN(setamount), 'ether')).encodeABI(),
          "chainId": settingStore.selectedBlockchainNetwork.chainid
      };
      // console.log(rawTransaction);
      var privKey = new Buffer(selectedWallet.privatekey,'hex');
      var tx = settingStore.selectedBlockchainNetwork.shortcode == "mainnet" ? new Tx(rawTransaction) : new Tx(rawTransaction,{'chain': settingStore.selectedBlockchainNetwork.shortcode});
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

  @action createETHAddress = (accinfoId,newwalletname,seedval,totalowners,totalsignatures,wallettype, isCloud) =>{
    if(seedval.split(" ").length != 12){
      showMessage({
        message: intl.get('Alert.InvalidLengthOfMnemonicePhrase'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed(seedval));
    const derivepath = DevivationPath.ETH;
    const addrNode = hdkey.derive(derivepath);   
    const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
    const addr = ethUtil.publicToAddress(pubKey).toString('hex');
    const address = ethUtil.toChecksumAddress(addr);

    //personal write - mok
    // const addr = this.publicToAddress(pubKey).toString('hex');
    // const address = this.toChecksumAddress(addr);
    // console.log(address);
    this.SaveETHWallet(accinfoId,accinfoId,newwalletname,seedval,addrNode._privateKey.toString('hex'),derivepath,address,"eth",totalowners,totalsignatures,wallettype,isCloud);
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
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    callApi("api/multisig/CreateMultiSigWallet",formdata,(response)=>{
      // console.log("CreateMultiSigWallet", response);
      cb(response);
    },(response)=>{
      // console.log("CreateMultiSigWallet", response);
      cberror(response);
    });
  }

  @action joinMultiSigWallet = (accinfoId,acctoken,pubaddress,cb,cberror) =>{
    // console.log(accinfoId,acctoken,pubaddress)
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', pubaddress);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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

  @action createMultiSigTransaction = (acctoken,from,to,token,cb,cberror) =>{
    console.log(acctoken,from,to,token);
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('fromwalletpublicaddress', from);
    formdata.append('towalletpublicaddress', to);
    formdata.append('totaltoken', token);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
        network:settingStore.selectedBlockchainNetwork.shortcode,
        ownerid:ownerId,
        isOwner:ownerId == accinfoId,
        // primaryTokenAsset:[],
        // otherTokenAsset:[],
        tokenassetlist:this.primaryTokenAsset,
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

  @action LoadTransactionByAddress(tokentype,publicaddress,cb,cberror){
    console.log(`${settingStore.selectedBlockchainNetwork.etherscanendpoint}?module=account&action=txlist&address=${publicaddress}&sort=desc&apikey=${SensitiveInfo.etherscanAPIKey}`);
    axios({
      method: 'post',
      // url: 'http://api.etherscan.io/api?module=account&action=txlist&address=' + publicaddress + '&sort=desc&apikey=' + SensitiveInfo.etherscanAPIKey,
      url: `${settingStore.selectedBlockchainNetwork.etherscanendpoint}?module=account&action=txlist&address=${publicaddress}&sort=desc&apikey=${SensitiveInfo.etherscanAPIKey}`,      
      data: {}
    })
    .then((response) =>{
      // console.log("LoadTransactionByAddress" + response)
      if(response.data.result.length > 0){
        var finallist = [];
        response.data.result.map((item, i) =>
        {
          var tokenvalueinhex = item.input.slice(-32);
          if(tokentype != "eth"){
            item.value = convertHexToDecimal(tokenvalueinhex);
          }
          var trx = {
            trxid : item.hash,
            from : item.from,
            to : item.to,
            block : item.blockNumber,
            gasprice : item.gasPrice,
            gasused : item.gasUsed,
            nonce : item.nonce,
            timestamp : item.timeStamp,
            value : Web3.utils.fromWei(item.value, 'ether'),
            confirmation : item.confirmations,
            status : this.ParseTrxStatus(item.txreceipt_status),
            isblockchain : true,
            action : "",
            signers : []
          }
          
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
  }

  @action LoadMultiSigTransactionByAddress(acctoken,publicaddress,cb,cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', publicaddress);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
        this.updateCompletedMultiSignTrx(acctoken, trxid, false);
      },cberror);
    }else{
      this.updateCompletedMultiSignTrx(acctoken, trxid , true);
    }
  }

  @action updateCompletedMultiSignTrx(acctoken, trxid, isredirect){
    var formdata = new FormData();
    formdata.append('trxhash', trxid);
    formdata.append('token', acctoken);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    callApi("api/multisig/GetCloudWalletByUserId",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action GetCloudWalletByPublicAddress(acctoken, publicaddress, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', publicaddress);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    callApi("api/multisig/GetCloudWalletByPublicAddress",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action ExitMultiSigWallet(acctoken, publicaddress, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('walletpublicaddress', publicaddress);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    console.log(acctoken)
    callApi("api/multisig/RemoveMultiSigWallet",formdata,(response)=>{
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action GetPrimaryTokenAssetByNetwork(acctoken, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    callApi("api/token/GetPrimaryTokenAssetByNetwork",formdata,(response)=>{
      console.log(response)
      if(response.status == 200){
        let primaryTokenAssetResult = [];
        if(response.tokenassetlist.length > 0){
          response.tokenassetlist.map((item,index)=>{
            item.Network = settingStore.selectedBlockchainNetwork.shortcode;
            primaryTokenAssetResult.push(item);
          })
        }
        this.primaryTokenAsset = primaryTokenAssetResult;
        // this.primaryTokenAsset = response.tokenassetlist;
      }
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }
  
  @action GetAllTokenAssetByNetwork(acctoken, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
    callApi("api/token/GetAllTokenAssetByNetwork",formdata,(response)=>{
      console.log(response)
      if(response.status == 200){
        let allTokenAssetResult = [];
        if(response.tokenassetlist.length > 0){
          response.tokenassetlist.map((item,index)=>{
            item.Network = settingStore.selectedBlockchainNetwork.shortcode;
            allTokenAssetResult.push(item);
          })
        }
        this.allTokenAsset = allTokenAssetResult;
        //this.allTokenAsset = response.tokenassetlist;
      }
      cb(response);
    },(response)=>{
      cberror(response);
    });
  }

  @action InsertTokenAssetToCloudWallet(acctoken, publicaddress, shortcode, cb, cberror){
    var formdata = new FormData();
    formdata.append('token', acctoken);
    formdata.append('publicaddress', publicaddress);
    formdata.append('shortcode', shortcode);
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
    formdata.append('network', settingStore.selectedBlockchainNetwork.shortcode);
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
}

const walletStore = new WalletStore();
export default walletStore;
// https://itnext.io/easily-integrate-mobx-into-react-native-app-with-expo-and-react-navigation-29ecf7c14012