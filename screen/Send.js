import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Clipboard,
  Share,
  BackHandler,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
  Vibration
} from 'react-native';
// import { QRCode } from 'react-native-custom-qr-codes';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, NumberPad, BottomButton, QRImagePicker, ScreenLoader } from '../extension/AppComponents';
import SecurityComponent from '../extension/SecurityComponent';
import { Color, Config, isNullOrEmpty, numberWithCommas, SensitiveInfo, toFixedNoRounding } from '../extension/AppInit';
// import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
// import EnIcon from 'react-native-vector-icons/Entypo'
import IoIcon from 'react-native-vector-icons/Ionicons'
// import * as Animatable from 'react-native-animatable';
import RiveIcon from '../extension/RiveIcon'
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
var QRCode = require('@remobile/react-native-qrcode-local-image');
import ImagePicker from 'react-native-image-picker';
import {showMessage} from "react-native-flash-message";
import Ripple from 'react-native-material-ripple';
import AccountInfoContext from '../context/AccountInfoContext';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import axios from 'axios';
const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const options = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

@inject('walletStore')
@inject('settingStore')
@inject('securityStore')
@observer
class Send extends Component {
  constructor(props){
    super(props);
    this.state = {
      recipientaddress:"",
      currentindex:0,
      setamount:"0",
      convertrate:35.14,
      selectedWallet:{},
      selectedToken:{
        AssetCode:"",
        TokenType:""
      }
      // requested2fa:false,
      // startresend2fa:false,
      // verifyOTP:"",
      // enter2fainput:"",
      // countdownvalue:""
    }
    // this.otpcountdown = null;

  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    this.setState({
      selectedWallet:params.selectedWallet,
      selectedToken:params.selectedToken
    });
    this.props.securityStore.setSecurityInit(this._onProceedSuccess,null);
    this.props.securityStore.setOTPType("Send");
  }

  componentWillUnmount(){
    clearInterval(this.otpcountdown);
  }

  //[{"walletname":"my wallet","userid":"5d4ef9c172dc2800e8ac477a","seedphase":"bamboo evidence true pepper chuckle bullet endorse render patch hold prize try","privatekey":"22cd90724a038879d36d9eebe0fe7411f12e27ced38360cf2d8df4f6ec0c02d9","derivepath":"m/44'/60'/0'/0/0","publicaddress":"0xd2B4309eed5d978244e852763aDD369579dc8e0B","addresstype":"eth","totalowners":0,"totalsignatures":0,"rvx_balance":"3.0"}]
  //068CA0B2F09D8D92B49465C3D8D961C7DAE372BD9D1D4E39132A1A2A11616731
  //0x90aD0aC0E687A2A6C9bc43BA7F373B9e50353084
  _makeTransfer = async() =>{
    if(!this.props.securityStore.requestverify){
      this.props.securityStore.setRequestVerify(true);
    }else{
      if(this.props.securityStore.isCurrentSecurityAction("OneTimePassword")){
        if(!this.props.securityStore.checkOTPValid()){
          showMessage({
            message: intl.get('Alert.InvalidOTP'),
            type: "warning",
            icon:"warning"
          });
          return;
        }
      }
      if(this.props.securityStore.isCurrentSecurityAction("TwoFactorAuthentication")){
        if(!this.props.securityStore.check2FAValid()){
          showMessage({
            message: intl.get('Alert.Invalid2FA'),
            type: "warning",
            icon:"warning"
          });
          return;
        }
      }

      let currentsteper = this.props.securityStore.selectedsecuritysteper - 1;
      this.props.securityStore.setTotalSecuritySteper(currentsteper);
      this.props.securityStore.updateSecurityCompState(true);
      if(currentsteper == 0){
        console.log("_onProceedSuccess")
        this._onProceedSuccess();
      }
    }
  } 

  _onProceedSuccess = () =>{
    this.screenloader.show();
    let checksumAddress = Web3.utils.toChecksumAddress(this.state.recipientaddress);
    if(this.state.selectedWallet.wallettype == "Shared"){
      this.props.walletStore.createMultiSigTransaction(this.props.settingStore.acctoken,this.state.selectedWallet.publicaddress,checksumAddress,parseFloat(this.state.setamount),this.state.selectedToken,(response)=>{
        clearInterval(this.otpcountdown);
        this.sendtab.setPage(3);
        this.screenloader.hide();
        // console.log(response);
      },(error)=>{
        this.screenloader.hide();
        // console.log(error);
      });
    }else{
      this.props.walletStore.TransferETH(this.state.selectedWallet,this.state.selectedToken,checksumAddress,this.state.setamount,(response)=>{
        this.sendtab.setPage(3);
        this.screenloader.hide();
        console.log(response);
      },(error)=>{
        this.screenloader.hide();
        showMessage({
          message: intl.get('Error.Unknow'),
          type: "danger",
          icon:"danger",
        });
        console.log(error);
      });
    }
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  onSetAmount = (value) =>{
    Vibration.vibrate(50);
    if(this.state.setamount.length == 20){
      return;
    }
    if(this.state.setamount.includes(".") && value == "."){
      return;
    }
    if(this.state.setamount.length == 1 && value == "0" && this.state.setamount == "0"){
      return;
    }
    if(this.state.setamount.length == 1 && value == "." && this.state.setamount == "0"){
      this.setState({
        setamount:"0."
      });
      return;
    }
    if(this.state.setamount.length == 1 && this.state.setamount == "0" && value != "0"){
      this.state.setamount = this.state.setamount.substring(0, this.state.setamount.length - 1);
    }
    this.setState({
      setamount:this.state.setamount + value
    },()=>{
      console.log(this.state.setamount);
    })
  }

  onRemoveAmount = () =>{
    Vibration.vibrate(50);
    this.setState({
      setamount:this.state.setamount.substring(0, this.state.setamount.length - 1)
    },()=>{
      if(this.state.setamount.length == 0){
        this.onSetAmount(0);
      }
      console.log(this.state.setamount);
    })
  }

  stepBackPressSend = () => {
    this._stepgoBackSend();
    return true;
  }

  _stepgoBackSend = () =>{
    let currentindex = this.state.currentindex;
    // console.log(currentindex);
    if(currentindex == 0){
      this.props.navigation.goBack();
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressSend);
    }else{
      currentindex--;
      this.sendtab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
    }
    // console.log(currentindex);
  }

  _goToSendAmount = () =>{
    if(this.state.selectedToken.TokenBalance == 0){
      showMessage({
        message: intl.get('Alert.Notenoughwalletbalance'),
        type: "warning",
        icon:"warning",
      });
      return;
    }
    if(parseFloat(this.state.setamount) > this.state.selectedToken.TokenBalance){
      showMessage({
        message: intl.get('Alert.InvalidAmount'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    if(Math.abs(this.state.setamount) == 0){
      showMessage({
        message: intl.get('Alert.InvalidAmount'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    this.sendtab.setPage(1);
    BackHandler.addEventListener('hardwareBackPress', this.stepBackPressSend);
  }

  _getHeaderTitle(){
    if(this.state.currentindex == 0){
      return intl.get('Common.Send').toUpperCase();
    }
    if(this.state.currentindex == 1){
      return intl.get('Common.SendTo').toUpperCase();
    }
    if(this.state.currentindex == 2){
      return intl.get('Common.AuthoriseTransaction').toUpperCase();
    }
    return "";
  }

  // _request2FA = () =>{
  //   this.setState({
  //     requested2fa:true,
  //     startresend2fa:true
  //   },()=>{
  //     console.log(this.props.settingStore.acctoken);
  //     this.Timer(120);
  //     this.props.walletStore.requestTransferOTP(this.props.settingStore.acctoken,(response)=>{
  //       console.log(response);
  //       if(response.status == 200){
  //         this.setState({
  //           verifyOTP:response.otp
  //         })
  //       }else{
  //         showMessage({
  //           message: intl.get('Error.' + response.msg),
  //           type: "warning",
  //           icon:"warning"
  //         });
  //       }
  //     })
  //   })
  // }

  // Timer = (duration) =>{ // in second
  //   clearInterval(this.otpcountdown);
  //   var timer = duration, minutes, seconds;
  //   this.otpcountdown = setInterval(() =>{
  //       minutes = parseInt(timer / 60, 10);
  //       seconds = parseInt(timer % 60, 10);

  //       minutes = minutes < 10 ? "0" + minutes : minutes;
  //       seconds = seconds < 10 ? "0" + seconds : seconds;

  //       this.setState({
  //         countdownvalue:minutes + ":" + seconds
  //       })
  //       if (--timer < 0) {
  //         clearInterval(this.otpcountdown);
  //         this.setState({
  //           requested2fa:false,
  //           countdownvalue:""
  //         })
  //           // timer = duration;
  //       }
  //   }, 1000);
  // }

  _verify2FA = () =>{
    this.sendtab.setPage(3);
    this.screenloader.hide();
  }

  _goToScanner = () =>{
    this.props.settingStore.goToScanner(this.stepBackPressSend,this.props.navigation,(result,disabled)=>{
      this.setState({
        recipientaddress:result
      },()=>{
        disabled(false);
      });
    });
  }

  _goBackandRemove = () =>{
    try{
      this.props.navigation.state.params.onRefresh();
    }catch(e){}
    BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressSend);
    this.props.navigation.goBack();
  }

  _checkField = () =>{
    let checksumAdderss = "";
    if(isNullOrEmpty(this.state.recipientaddress)){
      showMessage({
        message: intl.get('Alert.InvalidAddress'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    try{
      checksumAdderss = Web3.utils.toChecksumAddress(this.state.recipientaddress);
    }catch(e){
      showMessage({
        message: intl.get('Alert.InvalidAddress'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    if(!Web3.utils.isAddress(checksumAdderss)){
      showMessage({
        message: intl.get('Alert.InvalidAddress'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    this.sendtab.setPage(2);
  }

  formatCoinBalance(TokenBalance){
    try{
      TokenBalance = TokenBalance != undefined || TokenBalance != null ? TokenBalance : 0;
      if(TokenBalance % 1 != 0){
        return toFixedNoRounding(TokenBalance,4);
      }
      return toFixedNoRounding(TokenBalance,2);
    }catch(e){
      console.log("formatCoinBalance >> ", e)
    }
  }

  render() {
    var settings = this.props.settingStore.settings;
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={this._getHeaderTitle()} backfunc={()=> this._stepgoBackSend()}
            isclosebtn={this.state.currentindex == 0 ? true : false} noback={this.state.currentindex == 3  ? true : false} />
          <IndicatorViewPager ref={(r) => this.sendtab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.indicatorchild}>
              {/* <View style={styles.leftright}>
                
              </View> */}
              <Text style={styles.walletname}>{this.state.selectedWallet.walletname}</Text>
                <Text style={styles.walletamount}>{this.formatCoinBalance(this.state.selectedToken.TokenBalance)} {this.state.selectedToken.AssetCode}</Text>
              <View style={[styles.flexgrow,styles.centerlize]}>
                {/* <View style={styles.setamountctn}>
                  <TouchableOpacity style={styles.maximumbtn}>
                    <Text style={styles.maximumbtntt}>MAX</Text>
                  </TouchableOpacity> 
                </View> */}
                <View style={styles.receiveamountctn}>
                  <Text style={[styles.receiveamountcoin,this.state.setamount.length > 13 ?{fontSize:24,marginTop:0}: null]}>{`${this.state.setamount} ${this.state.selectedToken.AssetCode}`}</Text>
                  <Text style={styles.receiveamountprice}>{`$${numberWithCommas(parseFloat(this.state.setamount) * this.props.walletStore.getTokenPrice(this.state.selectedToken.AssetCode,this.state.selectedToken.TokenType),true)} ${this.props.settingStore.settings.currency}`}</Text>
                  {/* <RiveIcon name="exchange" color={Color.lightbluegreen} size={20} style={styles.exchangebtn} /> */}
                </View>
                <View style={[styles.receivenumpad,{marginTop:40}]}>
                  <NumberPad onEnter={(value)=> this.onSetAmount(value)} onRemove={()=> this.onRemoveAmount()} />
                </View>
              </View>
              <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._goToSendAmount()} />
            </View>
            <View style={styles.indicatorchild}>
              <View style={styles.aligncenter}>
                <Text style={styles.receiveamountcoin}>{`${this.state.setamount} ${this.state.selectedToken.AssetCode}`}</Text>
                {/* <Text style={[styles.receiveamountprice,{marginTop:0}]}>{`$${numberWithCommas(parseFloat(this.state.setamount) * this.state.convertrate,true)} ${settings.currency}`}</Text> */}
                <Text style={styles.recipienttt}>{intl.get('Common.RecipientAddress')}</Text>
                <TextInput multiline={true} numberOfLines={4} style={styles.recipientinput}
                onChangeText={(text)=> this.setState({recipientaddress:text})} value={this.state.recipientaddress} />
                <View style={[styles.bottomnavbtnctn,{marginTop:25}]}>
                  <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this.props.settingStore.pastetoclipboard((content)=>{
                      this.setState({recipientaddress:content})
                    })}>
                    <View style={styles.bottomnavbtn}>
                      <RiveIcon name="paste" color={"#fff"} size={22} />
                    </View>
                    <Text style={styles.whitelabel}>{intl.get('Common.PASTE')}</Text>
                  </Ripple>
                  {/*  this._showhideQRImagePicker() */}
                  <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this.qrimagepicker.show()}>
                    <View style={styles.bottomnavbtn}>
                      <RiveIcon name="QR" color={"#fff"} size={22} />
                    </View>
                    <Text style={styles.whitelabel}>{intl.get('Common.IMAGE')}</Text>
                  </Ripple>
                  <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this._goToScanner()}>
                    <View style={styles.bottomnavbtn}>
                      <RiveIcon name="scan" color={"#fff"} size={22} />
                    </View>
                    <Text style={styles.whitelabel}>{intl.get('Common.SCAN')}</Text>
                  </Ripple>
                </View>
              </View>
              <BottomButton title={intl.get('Common.Next')} onPress={()=> this._checkField() }/>
              {/* <BottomButton title="Next" onPress={()=> this._makeTransfer() }/> */}
            </View>
            <View style={styles.indicatorchild}>
              <ScrollView contentContainerStyle={styles.scrollcontainer}>
                <KeyboardAvoidingView style={styles.flexgrow}>
                  <View style={styles.authoctn}>
                    <Text style={styles.authott}>{intl.get('TrxDetail.From')}</Text>
                    <Text style={styles.authovalue} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.selectedToken.PublicAddress}</Text>
                  </View>
                  <View style={styles.authoctn}>
                    <Text style={styles.authott}>{intl.get('TrxDetail.To')}</Text>
                    <Text style={styles.authovalue} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.recipientaddress}</Text>
                  </View>
                  <View style={styles.authoctn}>
                    <Text style={styles.authott}>{intl.get('Common.TotalAmount')}</Text>
                    <Text style={[styles.authovalue,{textAlign:'right'}]}>{`${this.state.setamount} ${this.state.selectedToken.AssetCode}`}</Text>
                  </View>
                </KeyboardAvoidingView>
              </ScrollView>
              <SecurityComponent {...this.props} />
              <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._makeTransfer()} />
            </View>
            <View style={styles.indicatorchild}>
              <View style={[styles.flexgrow,styles.centerlize,{marginTop:-50}]}>
                <Image source={require('../resources/png6.png')} style={styles.centerimg2} resizeMode="contain" />
                <Text style={styles.finaltt}>{this.state.selectedWallet.wallettype == "Basic" ? intl.get('Common.SuccessfullySent') : intl.get('Common.TransactionCreated')}</Text>
              </View>
              <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._goBackandRemove()} />
            </View>
          </IndicatorViewPager>
        </LinearGradient>
        <QRImagePicker ref={(r) => this.qrimagepicker = r} onDecode={(result)=> this.setState({recipientaddress:result})} {...this.props}/>
        <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default Send;  

const styles = StyleSheet.create({
  countdownvalue:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    textAlign:'center',
    alignSelf:'center',
    marginVertical:20,
    fontSize:14
  },
  twofacinputctn:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row',
    marginHorizontal:20,
  },
  requestbtn:{
    backgroundColor:Color.deepblue,
    minHeight:55, 
    borderRadius:10,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:15,
    width:100,
    textAlign:'center',
  },
  centerlize:{
    justifyContent:"center",
    alignContent:"center",
    alignItems:"center",
  },
  scrollcontainer:{
    height:Config.availableHeight - 50,
  },
  twofacinput:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    // paddingVertical:15,
    // marginHorizontal:20,
    borderRadius:10,
    minHeight:55, 
    color:"#fff",
    fontFamily:Config.regulartt,
    flex:1,
    marginRight:10
    // backgroundColor:Color.rowblue,
    // width:Config.winwidth * 0.8,
    // maxWidth:400,
    // alignSelf:'center',
    // borderRadius:100,
    // marginTop:10,
    // color:"#fff",
    // fontFamily:Config.regulartt,
    // paddingHorizontal:20,
    // textAlign:'center',
    // paddingVertical:13
  },
  noticett:{
    color:Color.textgrey,
    fontFamily:Config.regulartt,
    textAlign:'center',
    width:"80%",
    alignSelf:'center',
    marginTop:20
  },
  authovalue:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14,
    width:'70%',
    textAlign:'left'
  },
  authott:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  authoctn:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    marginBottom:10,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginHorizontal:20,
    borderRadius:10,
    minHeight:55, 
  },
  finaltt:{
    color:Color.lightbluegreen,
    fontSize:35,
    fontFamily:Config.boldtt,
    // fontWeight:'bold',
    alignSelf:'center'
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  centerimg2:{
    height:Config.winwidth * 0.6,
    width:Config.winwidth * 0.6,
    maxWidth:350,
    maxHeight:350,
    alignSelf:"center",
    marginTop:40,
    marginBottom:40
  },
  recipientinput:{
    backgroundColor:Color.rowblue,
    fontFamily:Config.regulartt,
    color:"#fff",
    paddingTop:20,
    paddingBottom:20,
    paddingLeft:20,
    paddingRight:20,
    borderRadius:20,
    marginTop:15,
    width:"80%",
    textAlignVertical:"top",
    height:110
  },
  recipienttt:{
    fontFamily:Config.boldtt,
    color:"#fff",
    fontSize:15,
    marginTop:40
  },
  aligncenter:{
    // justifyContent:'center',
    alignItems:'center',
    flexGrow:1,
    flexShrink:1
  },
  leftright:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    width:Config.winwidth * 0.8,
    alignSelf:'center'
  },
  maximumbtntt:{
    fontFamily:Config.regulartt,
    color:"#fff",
  },
  maximumbtn:{
    backgroundColor:"#1E2159",
    borderRadius:30,
    width:80,
    padding:10,
    justifyContent:'center',
    alignItems:'center',
    alignSelf:'center',
    marginTop:15
  },
  walletamount:{
    fontFamily:Config.regulartt,
    color:Color.textgrey,
    textAlign:'center',
    fontSize:15
  },
  walletname:{
    fontFamily:Config.boldtt,
    color:Color.lightbluegreen,
    fontSize:17,
    textAlign:'center'
  },
  exchangebtn:{
    position:'absolute',
    right:20
  },
  receivenumpad:{
    alignSelf:'center',
    marginBottom:0
  },
  receiveamountprice:{
    color:Color.textgrey,
    fontSize:17,
    marginTop:10,
    fontFamily:Config.regulartt
  },
  receiveamountcoin:{
    color:'#fff',
    fontSize:30,
    fontFamily:Config.boldtt,
    marginTop:10,
    textAlign:'center'
  },
  receiveamountctn:{
    backgroundColor:Color.rowblue,
    borderRadius:20,
    padding:25,
    width:Config.winwidth * 0.8,
    maxWidth:350,
    // alignSelf:'center'
    justifyContent:'center',
    alignItems:'center',
    // marginTop:15
  },
  setamountctn:{
    flexGrow:1,
    flexShrink:1,
    // justifyContent:'space-between',
    alignItems:'center'
  },
  indicatorchild:{
    flex:1
  },
  receivectn:{
    justifyContent:'space-between',
    flexDirection:'column',
    // backgroundColor:'#ccc',
    flex:1
  },
  bottomnavinner:{
    alignItems:'center',
    justifyContent:'center'
  },
  whitelabel:{
    color:'#fff',
    marginTop:10,
    fontFamily:Config.regulartt
  },
  bottomnavbtn:{
    backgroundColor:'rgba(56,52,216,0.3)',
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
    paddingBottom:25,
    width:Config.winwidth * 0.6,
    alignSelf:'center'
  },
  addresskey:{
    color:Color.textgrey,
    fontSize:14,
    width:220,
    paddingTop:20,
    fontFamily:Config.regulartt
  },
  qrcontainer:{
    padding:20,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:15,
    alignSelf:'center',
    marginTop:50
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
