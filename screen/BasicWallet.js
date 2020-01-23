import React, {Component,useContext} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  Clipboard,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {TopHeader,TransBar,BottomButton, ScreenLoader} from '../extension/AppComponents'
import { Color, Config, shuffle, DevivationPath, sendToast, callApi, isNullOrEmpty } from '../extension/AppInit';
import { BaseButton,RectButton } from 'react-native-gesture-handler';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import bip39 from 'react-native-bip39'
import Ripple from 'react-native-material-ripple';
import {showMessage} from "react-native-flash-message";
import intl from 'react-intl-universal';
import AsyncStorage from '@react-native-community/async-storage';
import HDKey from 'hdkey';
const ethUtil = require('ethereumjs-util');
// const keccak256 = require('js-sha3').keccak256;
// const stripHexPrefix = require('strip-hex-prefix');
// const secp256k1 = require('secp256k1');
// var assert = require('assert');
import AccountInfoContext from '../context/AccountInfoContext';
import { observer, inject } from 'mobx-react';

// @inject(stores => ({
//   walletStore : stores,
// }))

//[{"userid":"5d4ef9c172dc2800e8ac477a",
// "seedphase":"broccoli focus domain future one sentence dignity extra like gate grab ahead",
// "privatekey":"abf82ff96b463e9d82b83cb9bb450fe87e6166d4db6d7021d0c71d7e960d5abe",
// "derivepath":"m/44'/60'/0'/0/0",
// "publicaddress":"0x959FD7Ef9089B7142B6B908Dc3A8af7Aa8ff0FA1",
// "addresstype":"eth"}]

@inject('walletStore')
@inject('settingStore')
@inject('languageStore')
@observer
class BasicWallet extends Component {
  constructor(props){
    super(props);
    this.state = {
      newwalletname:"",
      currentindex:0,
      selectedCoutryCode:"",
      showhidecountrypicker:false,
      seedval:"",
      seedphasearrange:[],
      selectedarrangeseed:[],
      basicwallettype:"device"
    }
    this.seedphase = [],
    this.onsubmited = false;
  }

  componentDidMount(){
    this.generate12SeedPhase();
    this._presetBasicCompleteSave();
    // this._GetPrimaryTokenAssetByNetwork();
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackPressNewWallet);
    }
  }

  componentWillUnmount(){
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressNewWallet);
    }
  }

  // _GetPrimaryTokenAssetByNetwork = () =>{
  //   this.props.walletStore.GetPrimaryTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
  //     console.log(response)
  //   },(response)=>{
  //     console.log(response)
  //   })
  // }

  _presetBasicCompleteSave = () =>{
    const {params} = this.props.navigation.state;
      this.props.walletStore.basicCompleteSave = (wallet) =>{
        if(this.state.basicwallettype == "device"){
          this.screenloader.hide();
          console.log("OK GOOD 1")
          this.newwallettab.setPage(6  - (params.isFirstTime ? 0 : 1));
        }else{
          console.log("OK GOOD 2")
          this.props.walletStore.CreateBasicWallet(this.props.settingStore.acctoken,wallet,(response)=>{
            console.log(response);
            this.screenloader.hide();
            if(response.status == 200){
              //new
              this.props.walletStore.InsertTokenAssetToCloudWallet(this.props.settingStore.acctoken,wallet.publicaddress,wallet.tokenassetlist,(response)=>{

              },(response)=>{

              })
              this.props.walletStore.saveETHWalletToStorage(wallet,()=>{
                this.newwallettab.setPage(6  - (params.isFirstTime ? 0 : 1));
                // this.setState({
                //   createdsharedwallet:wallet
                // },()=>{
                //   this.props.walletStore.resetHomeBeforeLoadWallet();
                //   this.props.walletStore.reloadWallet();
                //   this.sharewallettab.setPage(2);
                // })
              })
            }else{
              showMessage({
                message: intl.get('Error.' + response.msg), //"Something went wrong, Try again later."
                type: "danger",
                icon:"danger",
              });
            }
          },(response)=>{
            // console.log(response)
            this.screenloader.hide();
            showMessage({
              message: intl.get('Error.Unknow'),
              type: "danger",
              icon:"danger",
            });
          });
        }
      }
  }

  generate12SeedPhase = async() => {
    this.props.walletStore.generate12SeedPhase((mnemonic)=>{
      console.log(mnemonic);
      // mnemonic = "bamboo evidence true pepper chuckle bullet endorse render patch hold prize try";
      let distinctvalue  = [...new Set(mnemonic.split(" "))];
      if(distinctvalue.length != 12){
        this.generate12SeedPhase();
        return;
      }
      this.setState({
        seedval:mnemonic,
        seedphase:mnemonic.split(" ")
      },()=>{
        // console.log(this.state.seedval);
        this.shuffle(mnemonic.split(" "));
      })
    });
  }

  //0xd2B4309eed5d978244e852763aDD369579dc8e0B - correct
  // createETHAddress = () =>{
  //   // console.log(this.state.seedval);
  //   var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed(this.state.seedval));
  //   // var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed("bamboo evidence true pepper chuckle bullet endorse render patch hold prize try"));
  //   const derivepath = DevivationPath.ETH;
  //   const addrNode = hdkey.derive(derivepath);   
  //   const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
  //   const addr = ethUtil.publicToAddress(pubKey).toString('hex');
  //   const address = ethUtil.toChecksumAddress(addr);

  //   //personal write - mok
  //   // const addr = this.publicToAddress(pubKey).toString('hex');
  //   // const address = this.toChecksumAddress(addr);
  //   // console.log(address);
  //   this.SaveETHWallet(this.state.newwalletname,this.state.seedval,addrNode._privateKey.toString('hex'),derivepath,address,"eth",0,0);
  // }

  // SaveETHWallet = async (walletname,seedphase,privatekey,derivepath,publicaddress,addresstype,totalowners,totalsignatures) =>{
  //   // console.log(walletname,seedphase,privatekey,derivepath,publicaddress,addresstype,totalowners,totalsignatures);
  //   if(!this.onsubmited){
  //     let walletlist = [];
  //     try {
  //       let newwallet = {
  //         walletname:walletname,
  //         userid : accinfo.Id,
  //         seedphase : seedphase,
  //         privatekey : privatekey,
  //         derivepath : derivepath,
  //         publicaddress : publicaddress,
  //         addresstype : addresstype,
  //         totalowners: parseInt(totalowners),
  //         totalsignatures: parseInt(totalsignatures)
    
  //       };
  //       const value = await AsyncStorage.getItem('@wallet');
  //       if(value !== null) {
  //         walletlist = JSON.parse(value);
  //       }
  //       console.log("before", walletlist);
  //       //have to double make sure not insert twice
  //       if(walletlist.some(x => x.publicaddress == publicaddress) === false){
  //         walletlist.push(newwallet);
  //         console.log("after", walletlist);
  //         try {
  //           await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
  //             const {params} = this.props.navigation.state;
  //             this.onsubmited = true;
  //             this.newwallettab.setPage(5  - (params.isFirstTime ? 0 : 1));
  //           });
  //         } catch (e) {
  //           // saving error
  //         }
  //       }
  //     } catch(e) {
  //       console.log(e);
  //       // error reading value
  //     }
  //   }
  // }

  // publicToAddress = (pubKey, sanitize) =>{
  //   if (sanitize === void 0) { sanitize = false; }
  //   if (sanitize && pubKey.length !== 64) {
  //       pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
  //   }
  //   assert(pubKey.length === 64);
  //   // Only take the lower 160bits of the hash
  //   return new Buffer(this.keccak(pubKey).slice(-20));
  // };

  // keccak = (pubKey) =>{
  //   return keccak256.update(new Buffer(pubKey)).digest();
  // }

  // toChecksumAddress = (address) =>{
  //   address = stripHexPrefix(address).toLowerCase();
  //   var hash = keccak256(address).toString('hex');
  //   var ret = '0x';
  //   for (var i = 0; i < address.length; i++) {
  //       if (parseInt(hash[i], 16) >= 8) {
  //           ret += address[i].toUpperCase();
  //       }
  //       else {
  //           ret += address[i];
  //       }
  //   }
  //   return ret;
  // };

  shuffle = (arr) =>{
    var i,
        j,
        temp;
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }   

    this.setState({
      seedphasearrange:arr
    });
  };

  stepBackPressNewWallet = () =>{
    this._stepGoBackNewWallet();
    return true;
  }

  _stepGoBackNewWallet = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.newwallettab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
    }
    // console.log(currentindex)
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  renderSeed({item,index}){
    return(
      <View style={[styles.seeditem,{width:'auto'}]}>
        <Text style={styles.seeditemtt}>{`${index + 1}. ${item}`}</Text>
      </View>
    )
  }

  //414379
  renderSelectedSeed({item,index}){
    return(
      <TouchableOpacity activeOpacity={0.9} 
      style={[styles.seeditem,index >=9 ? {marginBottom:0}:null,{backgroundColor:"#414379",width:((Config.winwidth - 40 - 40)/3),paddingHorizontal:0}]} 
      onPress={()=> this._deselectPhraseSeed(item)}>
        {/* <Text style={styles.seeditemtt}>{`${index + 1}. ${item}`}</Text> */}
        <Text style={[styles.seeditemtt,{textAlign:'center'}]}>{`${item}`}</Text>
      </TouchableOpacity>
    )
  }

  renderBeforeSelectedSeed({item,index}){
    return(
      <TouchableOpacity activeOpacity={0.9} style={[styles.seeditem,{backgroundColor:"#343860",alignItems:'center'}]} onPress={()=> this._addPhraseToSeat(item)}>
        <Text style={styles.seeditemtt}>{`${item}`}</Text>
      </TouchableOpacity>
    )
  }

  _addPhraseToSeat = (seed) =>{
    this.setState({
      selectedarrangeseed:this.state.selectedarrangeseed.concat(seed),
      seedphasearrange:this.state.seedphasearrange.filter(x => x != seed)
    },()=>{
      if(this.state.selectedarrangeseed.length == 12){
        let seedphrase = this.state.seedphase.join(",");
        let selectedarrangeseed = this.state.selectedarrangeseed.join(",");
        if(seedphrase != selectedarrangeseed){
          showMessage({
            message: intl.get('Alert.IncorrectOrder'),
            type: "warning",
            icon:"warning"
          });
        }
      }
    });
  }

  _deselectPhraseSeed = (seed) =>{
    this.setState({
      selectedarrangeseed:this.state.selectedarrangeseed.filter(x => x != seed),
      seedphasearrange:this.state.seedphasearrange.concat(seed)
    });
  }

  _goToSetWalletName = () =>{
    this.newwallettab.setPage(1);
  }

  _VerifyPhraseArrangement = () =>{
    let seedphrase = this.state.seedphase.join(",");
    let selectedarrangeseed = this.state.selectedarrangeseed.join(",");
    // console.log(seedphrase);
    // console.log(selectedarrangeseed);
    if(seedphrase != selectedarrangeseed){
      showMessage({
        message: intl.get('Alert.IncorrectOrder'),
        type: "warning",
        icon:"warning"
      });
    }else{
      this.screenloader.show();
      if(this.state.basicwallettype == "device"){
        this.props.walletStore.setSkipStore(false);
        this.props.walletStore.createETHAddress(this.props.settingStore.accinfo.Id,this.state.newwalletname,this.state.seedval,0,0,"Basic", false);
      }else{
        this.props.walletStore.setSkipStore(true);
        this.props.walletStore.createETHAddress(this.props.settingStore.accinfo.Id,this.state.newwalletname,this.state.seedval,0,0,"Basic", true);
      }
    }
  }

  _createWalletDone = () =>{
    this.props.walletStore.reloadWallet();
    this.props.navigation.goBack();
  }

  _checkName = () =>{
    if(isNullOrEmpty(this.state.newwalletname)){
      showMessage({
        message: intl.get('Alert.Walletnameisempty'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    const {params} = this.props.navigation.state;
    this.newwallettab.setPage(3 - (params.isFirstTime ? 0: 1));
  }

  _onSelectCreateType = (type) =>{
    this.setState({
      basicwallettype:type
    },()=>{
      this.newwallettab.setPage(1);
    });
  }

  // this.state.currentindex == 0 || 
  render() {
    const {params} = this.props.navigation.state;
    return (
      <SafeAreaView style={styles.container}>
          <TransBar />
          <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
            <TopHeader {...this.props} title={this.state.currentindex == 0 ? intl.get('BasicWallet.CREATEBASICWALLET') : ""} 
            isclosebtn={this.state.currentindex == 0 ? true : false} noback={this.state.currentindex == 5  ? true : false} 
            backfunc={()=> this._stepGoBackNewWallet()} /> 
            <IndicatorViewPager ref={(r) => this.newwallettab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
              {/* step 1 */}
              {/* {params.isFirstTime ?
              <View style={[styles.indicatorchild,styles.centerlize]}>
                <Image source={require('../resources/png5.png')} style={styles.centerimg} resizeMode="contain" />
                <Ripple style={styles.circlebtn} activeOpacity={0.9} onPress={()=> this._goToSetWalletName()}>
                  <View accessible accessibilityRole="button">
                    <Text style={styles.circlebtntt}>{intl.get('Common.Create').toUpperCase()}</Text>
                  </View>
                </Ripple>
                <Text style={styles.desctt}>{intl.get('BasicWallet.anewwallet')}</Text>
              </View>
              : null} */}
              {/* step 1 */}
              <View style={styles.indicatorchild}>
                <Ripple style={styles.menulistitem} onPress={()=> this._onSelectCreateType('device')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"local"} color={"#fff"} size={37} />
                    <View style={styles.menulistiteminner2}>
                      <Text style={styles.menulistitemtt}>{intl.get('BasicWallet.StoreOnDevice')}</Text>
                      <Text style={styles.menulistitemtt2}>{intl.get('BasicWallet.StoreOnDevice.Info')}</Text>
                    </View>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple> 
                {/* <Ripple style={styles.menulistitem} onPress={()=> this._onSelectCreateType('cloud')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"cloud"} color={"#fff"} size={37} />
                    <View style={styles.menulistiteminner2}>
                      <Text style={styles.menulistitemtt}>{intl.get('BasicWallet.StoreOnCloud')}</Text>
                      <Text style={styles.menulistitemtt2}>{intl.get('BasicWallet.StoreOnCloud.Info')}</Text>
                    </View>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple> */}
              </View>
              {/* step 2 */}
              <View style={styles.indicatorchild}>
                <ScrollView contentContainerStyle={[styles.centerlize,{height:Config.availableHeight}]} keyboardShouldPersistTaps={'always'}>
                  <Image source={require('../resources/png4.png')} style={styles.centerimg} resizeMode="contain" />
                  <Text style={styles.headerwhite}>{intl.get('BasicWallet.TypeYourWalletName')}</Text>
                  <KeyboardAvoidingView style={styles.namingctn}>
                    <TextInput style={styles.naminginput} onChangeText={(text)=> this.setState({newwalletname:text})} onSubmitEditing={()=> this._checkName()} />
                    <Ripple activeOpacity={0.9} style={styles.arrownextbtn} onPress={()=> this._checkName()}>
                      <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                    </Ripple>
                  </KeyboardAvoidingView>
                </ScrollView>
              </View>
              {/* step 3 */}
              <View style={styles.indicatorchild}>
                <ScrollView>
                  <Text style={styles.headerwhite}>{intl.get('BasicWallet.BackupYourWalletNow')}</Text>
                  <Image source={require('../resources/png3.png')} style={[styles.centerimg2,{marginTop:0}]} resizeMode="contain" />
                  <View style={styles.bulletitem}>
                    <View style={[styles.bullet,this.props.languageStore.language == "en_US" ? {marginTop:7} :{marginTop:5}]}></View>
                    <Text style={styles.bullettt}>{intl.get('BasicWallet.Backup.Msg1')}</Text>
                  </View>
                  <View style={styles.bulletitem}>
                  <View style={[styles.bullet,this.props.languageStore.language == "en_US" ? {marginTop:7} :{marginTop:5}]}></View>
                    <Text style={styles.bullettt}>{intl.get('BasicWallet.Backup.Msg2')}</Text>
                  </View>
                  <View style={styles.bulletitem}>
                  <View style={[styles.bullet,this.props.languageStore.language == "en_US" ? {marginTop:7} :{marginTop:5}]}></View>
                    <Text style={styles.bullettt}>{intl.get('BasicWallet.Backup.Msg3')}</Text>
                  </View>
                </ScrollView>
                <BottomButton title={intl.get('Common.Gotit')} onPress={()=> this.newwallettab.setPage(4 - (params.isFirstTime ? 0 : 1))}/>
              </View>
              {/* step 4 */}
              <View style={styles.indicatorchild}>
                <View style={styles.flexgrow}>
                  <Text style={styles.headerwhite}>{intl.get('BasicWallet.YourMnemonicPhrase')}</Text>
                  <Text style={[styles.greytt,{paddingVertical:15}]}>{intl.get('BasicWallet.YourMnemonicPhrase.Msg')}</Text>
                  <View>
                    <FlatList
                      data={this.state.seedphase}
                      keyExtractor={(item,index) => index.toString()}
                      renderItem={this.renderSeed.bind(this)}
                      contentContainerStyle={styles.recoveryseedctn}
                      numColumns={3}
                    />
                  </View>
                  <View style={styles.bottomseed}>
                    <Text style={styles.actionbtntt} onPress={()=> this.props.settingStore.copytoclipboard(this.state.seedphase.join(" "))}>{intl.get('Common.COPY')}</Text>
                    {/* <Text style={styles.actionbtntt} onPress={()=> this.props.navigation.navigate("PhraseQR")}>QR CODE</Text> */}
                  </View>
                </View>
                <View style={styles.bottomnoticectn}>
                  <RiveIcon name="gan-tan-hao" color={Color.lightbluegreen} size={17} />
                  <Text style={[styles.greytt,{marginTop:3}]}>{intl.get('BasicWallet.YourMnemonicPhrase.Notice')}</Text>
                </View>
                <BottomButton title={intl.get('Common.Continue')} onPress={()=> this.newwallettab.setPage(5 - (params.isFirstTime ? 0: 1))}/>
              </View>
              {/* step 5 */}
              <View style={styles.indicatorchild}>
                <Text style={styles.headerwhite}>{intl.get('BasicWallet.VerifyyourMnemonicPhrase')}</Text>
                <Text style={styles.headerwhite}>{intl.get('BasicWallet.VerifyyourMnemonicPhrase2')}</Text>
                <View style={[styles.flexgrow]}>
                  <LinearGradient colors={["#2e3069","#242846"]} style={styles.selectseedctn}>
                    <FlatList
                      data={this.state.selectedarrangeseed}
                      keyExtractor={(item,index) => index.toString()}
                      renderItem={this.renderSelectedSeed.bind(this)}
                      contentContainerStyle={styles.selectseedinner}
                      numColumns={3}
                    />
                  </LinearGradient>
                  <View style={styles.recoveryseedbeforectnmain}>
                    <FlatList
                      data={this.state.seedphasearrange}
                      // extraData={this.state.seedphasearrange}
                      keyExtractor={(item,index) => index.toString()}
                      renderItem={this.renderBeforeSelectedSeed.bind(this)}
                      contentContainerStyle={styles.recoveryseedbeforectn}
                      numColumns={3}
                    />
                  </View>
                </View>
                <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._VerifyPhraseArrangement()}/>
              </View>
              {/* last step */}
              <View style={styles.indicatorchild}>
                <View style={[styles.flexgrow,styles.centerlize,{marginTop:-50}]}>
                  <Image source={require('../resources/png2.png')} style={styles.centerimg2} resizeMode="contain" />
                  <Text style={styles.finaltt}>{intl.get('Common.WalletCreated')}</Text>
                  <Text style={[styles.headerwhite,{marginTop:10}]}>{intl.get('Common.WalletName')}</Text>
                  <Text style={[styles.greytt,{marginTop:10}]}>{this.state.newwalletname}</Text>
                </View>
                <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._createWalletDone()}/>
              </View>
            </IndicatorViewPager>
          </LinearGradient>
          <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default BasicWallet;  

const styles = StyleSheet.create({
  menulistitemtt2:{
    fontFamily:Config.regulartt,
    fontSize:14,
    marginLeft:20,
    color:Color.textgrey
  },
  menulistitemtt:{
    fontFamily:Config.regulartt,
    fontSize:16,
    marginLeft:20,
    color:"#fff"
  },
  menulistiteminner:{
    flexDirection:'row',
    alignItems:'center'
  },
  menulistiteminner2:{
    flexDirection:'column',
  },
  menulistitem:{
    backgroundColor:Color.rowblue,
    borderRadius:10,
    marginHorizontal:20,
    padding:18,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:20
  },
  centerlize:{
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  recoveryseedbeforectn:{
    alignItems:'center',
    minHeight:150
  },
  recoveryseedbeforectnmain:{
    width:Config.winwidth - 40,
    alignSelf:'center',
    marginTop:40,
  },
  finaltt:{
    color:Color.lightbluegreen,
    fontSize:35,
    fontFamily:Config.boldtt,
    // fontWeight:'bold',
    alignSelf:'center'
  },
  selectseedinner:{
    alignItems:'center',
    minHeight:165
  },
  selectseedctn:{
    backgroundColor:"#2B2C61",
    // padding:20,
    paddingVertical:10,
    width:Config.winwidth - 40,
    borderRadius:15,
    // paddingBottom:10,
    alignSelf:'center',
    marginTop:20,
    // marginBottom:40
  },
  actionbtntt:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt
  },
  bottomseed:{
    flexDirection:'row',
    alignItems:'center',
    width:180,
    alignSelf:'center',
    // justifyContent:'space-between'
    justifyContent:'center'
  },
  recoveryseedctn:{
    // flexDirection:'column',
    // justifyContent:'space-between',
    alignItems:'center',
    // width:'80%',
    // flexWrap:'wrap',
    alignSelf:'center',
    marginTop:20,
    marginBottom:20,
    // backgroundColor:"#ccc"
  },
  seeditemtt:{
    color:"#fff",
    fontFamily:Config.regulartt,
    // fontSize:12
    // textAlign:'center'
  },
  seeditem:{
    backgroundColor:"#343860",
    borderRadius:100,
    paddingVertical:7,
    paddingHorizontal:10,
    marginBottom:12,
    width:100,
    maxWidth:110,
    marginLeft:5,
    marginRight:5
  },
  bottomnoticectn:{
    flexDirection:'row',
    alignSelf:'center',
    paddingVertical:20
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  greytt:{
    color:Color.textgrey,
    textAlign:'center',
    width:'60%',
    alignSelf:'center',
    fontFamily:Config.regulartt
  },
  bullettt:{
    color:Color.textgrey,
    fontSize:14,
    marginLeft:10,
    fontFamily:Config.regulartt
  },
  bullet:{
    backgroundColor:Color.textgrey,
    height:7,
    width:7,
    borderRadius:100,
    marginTop:7,
    fontFamily:Config.regulartt
  },
  bulletitem:{
    flexDirection:"row",
    justifyContent:'flex-start',
    alignItems:'flex-start',
    alignContent:'flex-start',
    width:'80%',
    alignSelf:'center',
    textAlignVertical:'top',
    marginBottom:15
  },
  scrollbarctn:{
    paddingBottom:20
  },
  arrownextbtn:{
    backgroundColor:Color.deepblue,
    height:45,
    width:45,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:100
  },
  naminginput:{
    // backgroundColor:'#123',
    flex:1,
    paddingHorizontal:20,
    paddingVertical:10,
    color:'#fff',
    fontFamily:Config.regulartt
  },
  namingctn:{
    flexDirection:'row',
    alignItems:'center',
    // backgroundColor:Color.greyblue,
    backgroundColor:"rgba(56,52,216,0.3)",
    marginTop:20,
    borderRadius:100,
    width:300,
    alignSelf:'center',
  },
  headerwhite:{
    color:"#fff",
    textAlign:'center',
    // fontWeight:'bold',
    fontFamily:Config.boldtt
  },
  indicatorchild:{
    flex:1
  },
  aligncenter:{
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  desctt:{
    color:"#ccc",
    textAlign:'center',
    marginTop:10,
    fontFamily:Config.regulartt
  },
  circlebtntt:{
    color:"#fff",
    fontFamily:Config.boldtt,
    fontSize:17
  },
  circlebtn:{
    backgroundColor:Color.deepblue,
    width:150,
    alignSelf:'center',
    paddingVertical:15,
    paddingHorizontal:20,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center'
  },
  centerimg2:{
    height:Config.winwidth * 0.6,
    width:Config.winwidth * 0.6,
    maxWidth:350,
    maxHeight:350,
    marginTop:-50,
    alignSelf:"center",
    // marginTop:40,
    marginBottom:40
  },
  centerimg:{
    height:Config.winwidth * 0.8,
    width:Config.winwidth * 0.8,
    maxWidth:400,
    maxHeight:400,
    alignSelf:"center",
    marginTop:-50,
    // marginTop:40,
    marginBottom:40
  },
  container: {
    flex: 1
  }
});
