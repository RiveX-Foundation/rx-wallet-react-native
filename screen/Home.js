import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  AppState,
  FlatList,
  ScrollView
} from 'react-native';
// import { TouchableOpacity } from 'react-native-gesture-handler';
import LinearGradientWrapper from 'react-native-linear-gradient';
import {TopHeader,TransBar,Refreshing} from '../extension/AppComponents'
import { Color, Config, isObjEmpty, numberWithCommas, isNullOrEmpty, toFixedNoRounding } from '../extension/AppInit';
import Carousel from 'react-native-snap-carousel';
import AntIcon from 'react-native-vector-icons/AntDesign'
import AwIcon from 'react-native-vector-icons/FontAwesome'
import Aw5Icon from 'react-native-vector-icons/FontAwesome5'
import RiveIcon from '../extension/RiveIcon'
import * as Animatable from 'react-native-animatable';
import IoIcon from 'react-native-vector-icons/Ionicons'
import Ripple from 'react-native-material-ripple';
import AsyncStorage from '@react-native-community/async-storage';
import AccountInfoContext from '../context/AccountInfoContext';
import axios from 'axios';
import intl from 'react-intl-universal';
import Menu, { MenuItem } from 'react-native-material-menu';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
// import abiArray from '../contractabi/tokenabi.json'
const Web3 = require('web3');
import { AreaChart, Grid} from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import { Defs, LinearGradient, Stop, Path } from 'react-native-svg'
// import LottieView from 'lottie-react-native';
import FastImage from 'react-native-fast-image'

@inject('walletStore')
@inject('settingStore')
@observer
class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      mywalletlist:[],
      // selectedsnapindex:0,
      appState:"",
      filtertype:"All",
      selectedfilter:"All",
      refreshing:false,
      totalrvx:0,
      totalworthcurrency:0,
      sparkline:[],
      // data: [50, 10, 40, 95, 85, 91, 35, 53, 24, 50]
      // showblur:false,
      // showsticky:false,
      selectedWallet:{}
    }
  }

  componentDidMount(){
    // console.log(JSON.stringify(this.props.settingStore.oldnetwork));
    this._getTokenSparkLineByAssetCode();
    this.props.settingStore.setOffline(this._openOffline);
    this.props.walletStore.setHomeBeforeLoadWallet(this._resetHomeBeforeLoadWallet);
    this.props.walletStore.setReloadWallet(this._loadCloudWallet);
    // this.props.walletStore.setReloadWallet(this._loadWallet);
    this.props.walletStore.setReloadSparkLine(this._getTokenSparkLineByAssetCode);
    this.props.walletStore.setHomeSelectedWallet(this._setHomeSelectedWallet);
    this._loadCloudWallet();
    this._loadWallet();
    // this._pullCoinBalance();
    this._GetAllTokenAssetByNetwork();
    this._GetPrimaryTokenAssetByNetwork();
  }

  componentWillUnmount(){
    // AppState.removeEventListener('change', this._handleAppStateChange); 
  }

  _GetAllTokenAssetByNetwork = () =>{
    if(this.props.walletStore.allTokenAsset.length == 0){
      this.props.walletStore.GetAllTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
        // console.log(response)
      },(response)=>{
        // console.log(response)
      });
    }
  }

  _GetPrimaryTokenAssetByNetwork = () =>{
    this.props.walletStore.GetPrimaryTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
      console.log("_GetPrimaryTokenAssetByNetwork", toJS(this.props.walletStore.primaryTokenAsset))
    },(response)=>{
      // console.log(response)
    })
  }

  _checkPinCodeExist = async() =>{
    try {
      if(this.props.settingStore.settings.pincode.enable){
        AppState.addEventListener('change', this._handleAppStateChange);
        this.props.navigation.navigate("PinCode",{isverify:true});
      }
      // const value = await AsyncStorage.getItem('@pincode');
      // if(value !== null) {
      //   let newpincode = {
      //     code:value,
      //     enable:true
      //   }
      //   this.props.settingStore.setPincode(newpincode);
      //   console.log(this.props.settingStore.pincode.code);
      //   AppState.addEventListener('change', this._handleAppStateChange);
      //   if(this.props.settingStore.pincode.enable){
      //     this.props.navigation.navigate("PinCode",{isverify:true});
      //   }
      // }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _pullCoinBalance = () =>{
    setInterval(()=>{
      this._loadTokenAssetList();
    },120000)
  }

  // _handleAppStateChange = (nextAppState) => {
  //   if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
  //     console.log('App has come to the foreground!');
  //     this.props.settingStore.setIsForeground(true);
  //     if(this.props.settingStore.isShare){
  //       this.props.settingStore.setdisabledPinCode(false);
  //       this.props.settingStore.setisShare(false);
  //     }
  //   }
  //   if(nextAppState == "background"){
  //     this.props.settingStore.setIsForeground(false);
  //     console.log(this.props.settingStore);
  //     if(this.props.settingStore.settings.pincode.enable && !this.props.settingStore.disabledPinCode){
  //       this.props.navigation.navigate("PinCode",{isverify:true});
  //     }
  //   }
  //   // console.log(nextAppState);
  //   this.setState({appState: nextAppState});
  // };

  _getTokenSparkLineByAssetCode = () =>{
    this.props.walletStore.getTokenSparkLineByAssetCode(this.props.settingStore.acctoken,"rvx",(response)=>{
      // console.log(response)
      if(response.status == 200){
        let sparklinelist = response.sparkline.sparkline;
        if(sparklinelist.length > 0){
          // console.log("come come come come");
          let newsparkline = [];
          sparklinelist.map((item,index)=>{
            newsparkline.push(item.value);
          })
          this.setState({
            sparkline:newsparkline
          },()=>{
            // console.log("sparkline", this.state.sparkline)
          })
        }else{
          // console.log("come come come come 2");
        }
      }
    },(response)=>{
      console.log(response);
    });
  }

  _resetHomeBeforeLoadWallet = () =>{
    this.setState({
      totalrvx:0
    })
  }

  _setHomeSelectedWallet = (wallet) =>{
    // console.log("_setHomeSelectedWallet", JSON.stringify(wallet))
    this.setState({
      selectedWallet:wallet
    },()=> {
      // console.log("_setHomeSelectedWallet", toJS(this.props.walletStore.primaryTokenAsset))
      //check primary token exist
      let primaryTokenAssetResult = toJS(this.props.walletStore.primaryTokenAsset);
      if(primaryTokenAssetResult.length > 0){
        let pymaridMissingAsset = [];
        primaryTokenAssetResult.map((tokenitem,index)=>{
          if(this.state.selectedWallet.tokenassetlist.length > 0){
            // if(!this.state.selectedWallet.tokenassetlist.find(x => x.AssetCode.toUpperCase() == tokenitem.AssetCode.toUpperCase() && x.Network == this.props.settingStore.oldnetwork.shortcode)){
            if(!this.state.selectedWallet.tokenassetlist.find(x => x.AssetCode.toUpperCase() == tokenitem.AssetCode.toUpperCase())){
              pymaridMissingAsset.push(tokenitem);
            }
          }
        });
        //if have missing asset insert to tokenassetlist
        if(pymaridMissingAsset.length > 0){
          this._UpdateWalletStorage(pymaridMissingAsset);
        }else{
          this._loadTokenAssetList();
        }
      }

    });
  }

  _UpdateWalletStorage = async(tokenassetlist) =>{
    try {
      const value = await AsyncStorage.getItem('@wallet')
      if(value !== null) {
        let walletlist = JSON.parse(value);
        if(walletlist.length > 0){
          walletlist.map(async(wallet,index)=>{
            if(wallet.publicaddress == this.state.selectedWallet.publicaddress){
              let oldtokenlist = wallet.tokenassetlist;
              wallet.tokenassetlist = oldtokenlist.concat(tokenassetlist);
              // console.log("_UpdateWalletStorage", wallet);
              await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
                this.setState({
                  selectedWallet:wallet
                },()=>{
                  this._loadTokenAssetList();
                })
              })
            }
          })
        }
      }
    }catch(e) {
      // error reading value
    }
  }

  //["#27286D","#22245C","#1B1F46","#151C33"]
  //["#482841","#3F253D","#372239","#2A1D33"]
  _renderItems({item,index}){
    var settings = this.props.settingStore.settings;
    // console.log("_renderItems", item)
    if(item.isLast){
      if(!isNullOrEmpty(this.state.selectedWallet.seedphase)){
        return(
          <TouchableOpacity style={styles.mywalletitemlast} activeOpacity={1} 
            onPress={()=> 
              this.state.mywalletlist.length == 0 ? 
              this.props.navigation.navigate("NewWallet",{isFirsttime:this.state.mywalletlist.length == 0 ? true : false}) 
              : 
              this.props.navigation.navigate("NewTokenAsset",{selectedWallet:this.state.selectedWallet})}>
            <AntIcon name="plus" color={Color.lightbluegreen} size={25} />
            <Text style={styles.addnewtt}>{this.state.mywalletlist.length == 0 ? intl.get('Common.AddNewWallet').toUpperCase() : intl.get('Common.AddNewTokenAsset').toUpperCase()}</Text>
          </TouchableOpacity> 
        )
      }
    }else{
      item.AssetCode = item.AssetCode.toUpperCase();
      return(
        <Animatable.View animation={"slideInRight"} duration={150 * (index + 1)} useNativeDriver>
          <LinearGradientWrapper colors={Color.coinGradient} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}
          style={{marginBottom:10,borderRadius:5}}>
            <Ripple key={index} activeOpacity={0.9} style={[styles.mywalletitem]} 
              onPress={()=> this.props.navigation.navigate("Transactions",{selectedWallet:this.state.selectedWallet,selectedToken:item})}>
              <FastImage source={{uri:item.LogoUrl}} style={styles.coinlogo} resizeMode={'contain'} />
              <View style={styles.coindetail}>
                <View style={styles.leftright}>
                  <Text style={[styles.mywalletitemname]}>{item.AssetCode}</Text>
                  <Text style={styles.totalcoin}>{item.TokenBalance ? `${item.TokenBalance % 1 != 0 ? toFixedNoRounding(item.TokenBalance,4) : toFixedNoRounding(item.TokenBalance,2)}` : `0.00`}</Text>
                </View>
                <View style={[styles.leftright,{marginTop:3}]}>
                  <Text style={styles.wallettype}>{item.Name}</Text>
                  <Text style={styles.totalcurrency}>${numberWithCommas(parseFloat(!isNaN(item.TokenPrice * item.TokenBalance) ? item.TokenPrice * item.TokenBalance : 0),true)}</Text>
                </View>
              </View>
            </Ripple>
          </LinearGradientWrapper>
        </Animatable.View>
      );
    }
  }

  // _onSelectedSnapIndex = (index) =>{
  //   // console.log(index)
  //   this.setState({
  //     selectedsnapindex:index
  //   })
  // }

  _openOffline = () =>{
    this.props.navigation.navigate("Offline");
  }

  _loadCloudWallet = async() =>{
    console.log("_loadCloudWallet")
    try {
      let walletlist = [];
      let mywalletlist = [];
      let haventaddedcloudlist = [];
      const value = await AsyncStorage.getItem('@wallet')
      // console.log(value);
      if(value !== null) {
        walletlist = JSON.parse(value);
      }
      // mywalletlist = walletlist.filter(x => x.userid != this.props.settingStore.accinfo.Id);
      // console.log(walletlist)
      // await AsyncStorage.setItem('@wallet', JSON.stringify(mywalletlist)).then(()=>{
      //   this._loadWallet();
      // })
      //get from walletlist, filter userid and network, left walletlist by current user
      // mywalletlist = walletlist.filter(x => x.userid == this.props.settingStore.accinfo.Id && x.network == this.props.settingStore.oldnetwork.shortcode);
      mywalletlist = walletlist.filter(x => x.userid == this.props.settingStore.accinfo.Id);
      this.props.walletStore.GetCloudWalletByUserId(this.props.settingStore.acctoken, async(response)=>{
        const mycloudwallet = response.wallet;
        console.log("mycloudwallet", mycloudwallet)
        if(mycloudwallet.length > 0){
          mycloudwallet.map((cloud,index)=>{
            if(cloud.Enable){
              // console.log(mywalletlist.some(x => x.publicaddress == multi.PublicAddress && x.userid == this.props.settingStore.accinfo.Id))
              if(mywalletlist.some(x => x.publicaddress == cloud.PublicAddress && x.userid == this.props.settingStore.accinfo.Id) === false){
                // console.log(cloud);
                let newwallet = {
                  walletname:cloud.WalletName,
                  userid : this.props.settingStore.accinfo.Id,
                  seedphase : cloud.Seedphase,
                  privatekey : cloud.PrivateAddress,
                  derivepath : cloud.DerivePath,
                  publicaddress : cloud.PublicAddress,
                  addresstype : cloud.AddressType,
                  totalowners: cloud.NumbersOfOwners,
                  totalsignatures: cloud.NumbersOfSigners,
                  wallettype: cloud.WalletType == "basic" ? "Basic" : "Shared",
                  rvx_balance:0,
                  network:cloud.Network,
                  ownerid:cloud.OwnerId,
                  isOwner:cloud.OwnerId == this.props.settingStore.accinfo.Id,
                  tokenassetlist:this._formatCloudWalletAsset(cloud.TokenAssets),//cloud.TokenAssets ? cloud.TokenAssets : [],
                  isCloud:true
                };
                haventaddedcloudlist.push(newwallet);
              }
            }
          });
          try {
            walletlist = walletlist.concat(haventaddedcloudlist);
            console.log("haventaddedcloudlist", walletlist)
            await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
              this._loadWallet();
            })
          } catch (e) {
            // saving error
          }
        }else{
          this._loadWallet();
        }
      },(response)=>{
  
      });
      
    }catch(e) {
      // error reading value
    }
  }

  _formatCloudWalletAsset = (TokenAssets) =>{
    let TokenAssetsList = [];
    if(TokenAssets){
      TokenAssets.map((tokenasset,index)=>{
        // tokenasset.Network = this.props.settingStore.oldnetwork.shortcode;
        TokenAssetsList.push(tokenasset);
      })
    }
    return TokenAssetsList;
  }

  _loadWallet = async() => {
    console.log("start load");
    this.setState({totalrvx:0});
    try {
      const value = await AsyncStorage.getItem('@wallet')
      // console.log(value);
      if(value !== null) {
        let walletlist = JSON.parse(value);
        console.log("_loadWallet", walletlist)
        if(walletlist.length > 0){
          walletlist = walletlist.filter(x => x.userid == this.props.settingStore.accinfo.Id);
          // walletlist = walletlist.filter(x => x.network == this.props.settingStore.oldnetwork.shortcode);
            if(walletlist.length > 0){
              if(!isObjEmpty(toJS(this.state.selectedWallet))){
                // console.log(toJS(this.state.selectedWallet))
                this._setHomeSelectedWallet(walletlist.find(x => x.publicaddress == toJS(this.state.selectedWallet).publicaddress));
              }else{
                const lastwalletvalue = await AsyncStorage.getItem('@lastwallet');
                if(!isNullOrEmpty(lastwalletvalue)){
                  let lastwallet = JSON.parse(lastwalletvalue);
                  console.log("lastwallet", lastwallet)
                  this._setHomeSelectedWallet(lastwallet);
                }else{
                  this._setHomeSelectedWallet(walletlist[0]);
                }
              }
              this.setState({
                mywalletlist:walletlist
              },()=>{
                this.props.walletStore.setWallets(walletlist);
              });
              // walletlist.map(async(wallet,index) =>{
              //   // console.log(wallet);
              //   if(this.props.walletStore.primaryTokenAsset.length > 0){
              //     console.log(JSON.stringify(this.props.walletStore.primaryTokenAsset));
              //     wallet.tokenassetlist = this.props.walletStore.primaryTokenAsset;
              //   }
              //   this.setState({
              //     mywalletlist:walletlist
              //   },()=>{
              //     // console.log("after _loadWallet", walletlist)
              //     this.props.walletStore.setWallets(walletlist);
              //   });
              // });

              // const web3 = new Web3(this.props.settingStore.oldnetwork.infuraendpoint);
              // // Get ERC20 Token contract instance
              // let contract = new web3.eth.Contract(abiArray, this.props.settingStore.oldnetwork.contractaddr);
              // walletlist.map(async(wallet,index) =>{
              //   // console.log(wallet);
              //   web3.eth.call({
              //     to: this.props.settingStore.oldnetwork.contractaddr,
              //     data: contract.methods.balanceOf(wallet.publicaddress).encodeABI()
              //   }).then(balance => {  
              //     balance = balance / (10**18);
              //     wallet.rvx_balance = balance;
              //     this.setState({
              //       refreshing:false,
              //       mywalletlist: walletlist,
              //       totalrvx: (isNaN(this.state.totalrvx) ? 0 : this.state.totalrvx) + balance
              //     }, ()=>{
              //       this.props.walletStore.setWallets(walletlist);
              //     });
              //   });
              // });
            }else{
              this._setHomeSelectedWallet({});
              this._emptyWallet();
            }
        }else{
          this._emptyWallet();
        }
      }else{ //totally no wallet
        this._emptyWallet();
      }
    } catch(e) {
      // error reading value
    }
  }

  _emptyWallet = () =>{
    this.setState({
      mywalletlist:[],
      selectedWallet:{}
    },()=>{
      this.props.navigation.navigate("NewWallet",{isFirsttime:true});
    })
  }

  // _loadTokenAssetList = () =>{
  //   this.setState({
  //     refreshing:false,
  //     totalworthcurrency:0
  //   },()=>{
  //     // console.log("_loadTokenAssetList" , this.state.selectedWallet)
  //     if(!isObjEmpty(this.state.selectedWallet)){
  //       let totalworthcurrency = 0;
  //       const web3 = new Web3(this.props.settingStore.oldnetwork.infuraendpoint);
  //       let selectedTokenAssetList = this.state.selectedWallet.tokenassetlist.filter(x => x.Network == this.props.settingStore.oldnetwork.shortcode);
  //       selectedTokenAssetList.map(async(tokenitem,index) =>{
  //         // console.log("tokenitem.TokenType" , tokenitem.TokenType)
  //         if(tokenitem.TokenType == "eth"){
  //           web3.eth.getBalance(this.state.selectedWallet.publicaddress).then(balance => { 
  //             balance = balance / (10**18);
  //             tokenitem.TokenBalance = balance;
  //             // console.log("ETH >> ", tokenitem.AssetCode , tokenitem.TokenBalance)
  //             //tokenitem.CurrentPrice
  //             totalworthcurrency += (this.props.settingStore.convertrate * balance);
  //             this.setState({
  //               selectedWallet: this.state.selectedWallet,
  //               // totalworthcurrency:this.state.totalworthcurrency + (this.props.settingStore.convertrate * balance)
  //             });
  //           })
  //         }else{
  //           var TokenInfo = tokenitem.TokenInfoList.find(x => x.Network == this.props.settingStore.oldnetwork.shortcode);
  //           TokenInfo = toJS(TokenInfo);
  //           var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
  //           // Get ERC20 Token contract instance
  //           let contract = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
  //           web3.eth.call({
  //             to: !isNullOrEmpty(TokenInfo.ContractAddress) ? TokenInfo.ContractAddress : null,
  //             data: contract.methods.balanceOf(this.state.selectedWallet.publicaddress).encodeABI()
  //           }).then(balance => {  
  //             balance = balance / (10**18);
  //             tokenitem.TokenBalance = !isNaN(balance) ? balance : 0;
  //             totalworthcurrency += (this.props.settingStore.convertrate * balance);
  //             this.setState({
  //               selectedWallet: this.state.selectedWallet,
  //               // totalworthcurrency:this.state.totalworthcurrency + (this.props.settingStore.convertrate * balance)
  //             });
  //           });
  //         }
  //         // console.log("totalworthcurrency", totalworthcurrency)
  //       });
        
  //     }
  //   })
  // }

  _loadTokenAssetList = () =>{
    if(!isObjEmpty(this.state.selectedWallet)){
      if(this.state.selectedWallet.tokenassetlist.length > 0){
        this.props.walletStore.loadTokenAssetList(this.state.selectedWallet).then((value) =>{
          this.setState({
            refreshing:false,
            selectedWallet:value
          })
        })
      }
    }
  }

  _showhideDropDownMenu = (isShow,type,filtername) =>{
    if(isShow){
      this.dropdownmenu.show();
    }else{
      this.setState({
        // totalrvx:0,
        filtertype:type,
        selectedfilter:filtername
      },()=>{
        this.dropdownmenu.hide();
        // this._loadWallet();
      })
    }
  }

  _onRefresh = () =>{
    this.setState({refreshing:true,totalworthcurrency:0});
    this._loadTokenAssetList();
    // this._loadWallet();
    // this._loadCloudWallet();
  }

  // _showhidesticky(){
  //   this.setState({
  //     showsticky:!this.state.showsticky
  //   })
  // }

  _dropTitle(){
    let droptitle = intl.get('Common.All');
    if(this.state.filtertype == "Basic") droptitle = intl.get('Common.BasicWallet');
    if(this.state.filtertype == "Shared") droptitle = intl.get('Common.ShareWallet');
    return droptitle;
  }

  _getTotalWorth(){
    // var totalworth = 0;
    // if(!isObjEmpty(this.state.selectedWallet)){
    //   let tokenassetlist = toJS(this.state.selectedWallet.tokenassetlist);
    //   tokenassetlist = tokenassetlist.filter(x => x.Network == this.props.settingStore.oldnetwork.shortcode);
    //   if(tokenassetlist.length > 0){
    //     tokenassetlist.map((asset,index)=>{
    //       totalworth += asset.TokenBalance;
    //     })
    //   }
    // }
    // return `$${numberWithCommas(parseFloat(!isNaN(this.props.settingStore.convertrate * totalworth) ? this.props.settingStore.convertrate * totalworth : 0),true)}`;
    var totalworth = 0;
    if(!isObjEmpty(this.state.selectedWallet)){
      totalworth = this.state.selectedWallet.totalassetworth;
    }
    return `$${numberWithCommas(parseFloat(!isNaN(totalworth) ? totalworth : 0),true)}`;
  }

  //rgb(134, 65, 244)
  render() {
    return (
      <SafeAreaView style={styles.container}>
        {/* <LottieView source={require('../resources/try5.json')} autoPlay loop style={{height:400}}/> */}
        <TransBar />
        <LinearGradientWrapper colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} ishome title={this.state.selectedWallet ? this.state.selectedWallet.walletname : ""} backfunc={()=> this.props.navigation.navigate("Settings")} totalunread={0}
          style={{justifyContent:'space-between'}}/>
          <ScrollView  refreshControl={
              <Refreshing refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}/>
            } >
            <View style={styles.totalrvxctn}>
              {/* <Text style={[styles.totalrvx,{fontSize:25}]}>{`$${numberWithCommas(parseFloat(this.state.totalrvx) * (this.props.settingStore.settings.currency == "USD" ? this.props.settingStore.convertrate : this.props.settingStore.convertrate * 4),true)}`}</Text> */}
              {/* <Text style={[styles.totalrvx,{fontSize:25}]}>{`$${numberWithCommas(parseFloat(this._getTotalWorth),true)}`}</Text> */}
              <Text style={[styles.totalrvx,{fontSize:25}]}>{this._getTotalWorth()}</Text>
              <Text style={[styles.totalrvxcctt,{fontSize:16}]}>{this.props.settingStore.settings.currency}</Text>
            </View>
            {/* <View style={styles.totalrvxctn}>
              <Image source={require('../resources/logo.png')} style={styles.tokenlogo} resizeMode={'contain'} />
              <Text style={styles.totalrvx}>{this.state.totalrvx} RVX</Text>
              <Text style={styles.totalrvxcctt}>{`$${numberWithCommas(parseFloat(this.state.totalrvx) * (this.props.settingStore.settings.currency == "USD" ? this.props.settingStore.convertrate : this.props.settingStore.convertrate * 4),true)} ${this.props.settingStore.settings.currency}`}</Text>
            </View> */}
            {/* {this.props.settingStore.isNetworkConnected || this.state.sparkline.length > 0 ?
            <AreaChart
              style={{ height: 200}}
              data={this.state.sparkline}
              // data={data}
              contentInset={{ top: 30, bottom: 30 }}
              curve={shape.curveNatural}
              // svg={{ fill: 'rgba(52,55,97,0.5)' }}
              svg={{ fill: 'url(#gradient)' }}
              // yAccessor={({ item }) => item.value}
              // onPress={(val) => console.log(val)}
              // animate
            >
              <Line />
              <Gradient />
              <Tips />
            </AreaChart>
            :
            <Text>{intl.get('Offline.Yourecurrentlyoffline')}</Text>
            } */}
            {/* <View style={{justifyContent: 'flex-end',alignItems:'flex-end',paddingBottom:10}}>
              <Menu
                ref={(r) => this.dropdownmenu = r}
                button={
                  <TouchableOpacity activeOpacity={1} onPress={()=> this._showhideDropDownMenu(true)} style={styles.dropdownmenuitemctn}>
                    <Text style={[styles.dropdownmenuitemtt,{color:"#fff"}]}>{this._dropTitle()}</Text>
                    <IoIcon name={"ios-arrow-down"} color={"#fff"} size={18} style={{marginLeft:10}} />
                  </TouchableOpacity>
                }
                style={{borderRadius:7,overflow:'hidden',backgroundColor:'#343761'}}
              >
                <MenuItem onPress={()=> this._showhideDropDownMenu(false,'All',intl.get('Common.All'))} style={styles.dropdownmenuitem} children={
                  <Text style={styles.dropdownmenuitemtt}>{intl.get('Common.All')}</Text>
                } />
                <MenuItem onPress={()=> this._showhideDropDownMenu(false,'Basic',intl.get('Common.BasicWallet'))} style={styles.dropdownmenuitem} children={
                  <Text style={[styles.dropdownmenuitemtt]}>{intl.get('Common.BasicWallet')}</Text>
                } />
                <MenuItem onPress={()=> this._showhideDropDownMenu(false,'Shared',intl.get('Common.ShareWallet'))} style={styles.dropdownmenuitem} children={
                  <Text style={[styles.dropdownmenuitemtt]}>{intl.get('Common.ShareWallet')}</Text>
                } />
              </Menu>
            </View> */}
            {/* rgba(28,31,70,0.5) */}
            {/* <FlatList
              data={[...this.state.filtertype == "All" ? this.state.mywalletlist : this.state.mywalletlist.filter(x => x.wallettype == this.state.filtertype),{isLast:true}]}
              keyExtractor={(item,index) => index.toString()}
              renderItem={this._renderItems.bind(this)}
              contentContainerStyle={styles.mywalletlistctn}
            /> */}
            {!isObjEmpty(this.state.selectedWallet) ?
            <FlatList
              // data={[...this.state.mywalletlist,{isLast:true}]}
              // data={[...this.state.selectedWallet.tokenassetlist.filter(x => x.Network == this.props.settingStore.oldnetwork.shortcode),{isLast:true}]}
              data={[...this.state.selectedWallet.tokenassetlist,{isLast:true}]}
              keyExtractor={(item,index) => index.toString()}
              renderItem={this._renderItems.bind(this)}
              contentContainerStyle={styles.mywalletlistctn}
            />
            :
            <View style={styles.mywalletlistctn}>
              <TouchableOpacity style={styles.mywalletitemlast} activeOpacity={1} 
                onPress={()=> this.props.navigation.navigate("NewWallet",{isFirsttime:this.state.mywalletlist.length == 0 ? true : false})}>
                <AntIcon name="plus" color={Color.lightbluegreen} size={25} />
                <Text style={styles.addnewtt}>{this.state.mywalletlist.length == 0 ? intl.get('Common.AddNewWallet').toUpperCase() : intl.get('Common.AddNewTokenAsset').toUpperCase()}</Text>
              </TouchableOpacity>
            </View> 
            }
            {/* <View style={{flex:1,justifyContent:"center"}}>
              <Carousel 
                ref={(c) => { this._carousel = c; }}
                data={[...this.state.mywalletlist,{isLast:true}]}
                // extraData={null} 
                renderItem={this._renderMyWallet.bind(this)}
                sliderWidth={Config.winwidth}
                itemWidth={Config.winwidth * 0.75}
                containerCustomStyle={styles.carouselctn}
                contentContainerCustomStyle={styles.carouselctn2}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                onSnapToItem={(index)=> this._onSelectedSnapIndex(index)}
              />
            </View> */}
            {/* {this.state.mywalletlist.length > 0 ?
            <Animatable.View style={styles.bottomnavbtnctn} useNativeDriver duration={500}
              animation={this._animateInit()}>
              <Ripple activeOpacity={0.9} style={[styles.bottomnavbtn,{backgroundColor:"#ff406e"}]}
              onPress={()=> this.props.navigation.navigate("Receive",{selectedWallet:this.state.mywalletlist[this.state.selectedsnapindex]})}>
                <RiveIcon name="QR" color={"#fff"} size={22} />
              </Ripple>
              <Ripple activeOpacity={0.9} style={[styles.bottomnavbtn,{backgroundColor:"#ffae00"}]}
              onPress={()=> this.props.navigation.navigate("Send",{selectedWallet:this.state.mywalletlist[this.state.selectedsnapindex]})}>
                <AwIcon name="send" color={"#fff"} size={22} />
              </Ripple>
              <Ripple activeOpacity={0.9} style={[styles.bottomnavbtn,{backgroundColor:"#57c4a7"}]}
              onPress={()=> this.props.navigation.navigate("Stacking")}>
                <RiveIcon name="plant" color={"#fff"} size={25} />
              </Ripple>
            </Animatable.View>
            : null } */}
            {this.state.selectedWallet && this.state.selectedWallet.wallettype == "Shared" ?
            <Animatable.View useNativeDriver animation={"slideInRight"} duration={500} style={styles.flagleftctn}>
              <Text style={styles.flaglefttt}>{this.state.selectedWallet.totalsignatures}-to-{this.state.selectedWallet.totalowners}</Text>
            </Animatable.View>
            : null }
          </ScrollView>
        </LinearGradientWrapper>
      </SafeAreaView>
    );
  }
}

export default Home;  

const styles = StyleSheet.create({
  flaglefttt:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    fontSize:14
  },
  flagleftctn:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    borderTopLeftRadius:30,
    borderBottomLeftRadius:30,
    position:'absolute',
    top:10,
    right:0
  },
  coinlogo:{
    width:37,
    height:37
  },
  tokenlogo:{
    width:35,
    height:35,
    marginBottom:10,
    marginTop:10
  },
  totalrvxcctt:{
    color:Color.textgrey,
    fontFamily:Config.regulartt,
    fontSize:13
  },
  sparklinetiptt:{
    color:"#3c9292",
    fontFamily:Config.regulartt,
    fontSize:13
  },
  totalrvxctn:{
    borderColor:"#2D5470",
    // borderColor:Color.rippleblueColor,
    borderWidth:1,
    height:170,
    width:170,
    borderRadius:100,
    marginTop:10,
    // borderStyle: 'dashed',

    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    alignSelf:'center',
    // marginBottom:5

    // backgroundColor:'#ccc'
  },
  totalrvx:{
    fontFamily:Config.regulartt,
    color:Color.lightbluegreen,
    fontSize:24,
    maxWidth:'80%',
    textAlign:'center'
  },
  totalrvxtt:{
    fontFamily:Config.regulartt,
    color:Color.lightbluegreen,
    fontSize:22
  },
  dropdownmenuitem:{
    width:150
  },
  dropdownmenuitemctn:{
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    paddingHorizontal:20,
    overflow:'hidden',
    paddingVertical:10,
    // backgroundColor:"#000"
  },
  dropdownmenuitemtt:{
    fontFamily:Config.regulartt,
    color:"#fff",
    fontSize:16
  },
  mywalletlistctn:{
    paddingVertical:20,
    // paddingTop:10,
    // paddingBottom:20,
    paddingHorizontal:15
  },
  leftright:{
    justifyContent:'space-between',
    flexDirection:'row',
    alignItems:'center'
  },
  walletimg:{
    height:100,
    width:100
  },
  addnewtt:{
    color:Color.lightbluegreen,
    fontSize:14,
    marginTop:10,
    fontFamily:Config.regulartt
  },
  earnctn:{
    flexDirection:'row',
    alignItems:'center',
        marginTop:10,
  },
  statusearn:{
    color:Color.textgrey,
    fontSize:17,
    fontFamily:Config.regulartt
  },
  earnicon:{
    marginLeft:5
  },
  aligncenter:{
    alignItems:'center'
  },  
  totalcurrency:{
    color:Color.textgrey,
    fontSize:17,
    fontFamily:Config.regulartt
  },
  wallettype:{
    color:Color.textgrey,
    fontSize:17,
    fontFamily:Config.regulartt
  },
  totalcoin:{
    color:'#fff',
    fontSize:18,
    // fontWeight:'bold'
    fontFamily:Config.regulartt
  },
  mywalletitemname:{
    // color:Color.basicColor,
    color:Color.lightbluegreen,
    fontSize:18,
    fontFamily:Config.regulartt
  },
  bottomnavbtn:{
    backgroundColor:'rgba(255,255,255,0.6)',
    height:50,
    width:50,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center'
  },
  bottomnavbtnctn:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingTop:25,
    paddingBottom:25,
    width:Config.winwidth * 0.6,
    alignSelf:'center',
  },
  carouselctn2:{
    // backgroundColor:"#333",
    minHeight:350,
    height:(Config.winheight - Config.statusBarHeight - 50 - 100) * 0.8,
    maxHeight:450,
    
  },
  carouselctn:{
    // backgroundColor:"#ccc",
    minHeight:350,
    height:(Config.winheight - Config.statusBarHeight - 50 - 100) * 0.8,
    maxHeight:450,
        // justifyContent:"center",
    // alignItems:"center",
    // alignContent:"center",
    // paddingTop:45
  },
  mywalletitemlast:{
    borderColor:"#2D5470",
    borderWidth:2,
    // height:140,
    width:"100%",
    borderRadius:5,
    padding:12,
    borderStyle: 'dashed',
    justifyContent:'center',
    alignItems:'center',
    alignSelf:'center'
  },
  // mywalletitemlast:{
  //   borderColor:"#2D5470",
  //   borderWidth:2,
  //   height:140,
  //   width:140,
  //   borderRadius:100,
  //   // borderStyle: 'dashed',
  //   justifyContent:'center',
  //   alignItems:'center',
  //   alignSelf:'center'
  // },
  mywalletitem:{
    // backgroundColor:Color.rowblue,
    borderRadius:5,
    padding:18,
    flexDirection:'row',
    alignItems:'center',
    // borderLeftWidth:5,
    // borderLeftColor:Color.basicColor
  },
  coindetail:{
    flex:1,
    marginLeft:20
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#123',
  }
});
