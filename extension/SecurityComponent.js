import React, {Component,PureComponent} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput
} from 'react-native';
import { Color, Config, callApi } from './AppInit.js';
import Ripple from 'react-native-material-ripple';
import { autorun, toJS, reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import {showMessage} from "react-native-flash-message";
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import TouchID from 'react-native-touch-id';
import intl from 'react-intl-universal';

@inject('settingStore')
@inject('securityStore')
@observer
class SecurityComponent extends Component{
  constructor(props){
    super(props);
    this.state = {
      selectedsecurity:this.props.settingStore.settings.security.selected,
      verifyOTP:"",
      enterotpinput:"",
      countdownvalue:"",
      requestedotp:false,
      startresendOTP:false,
      selectedsecuritystepper:this.props.settingStore.settings.security.selectedlist.length
    }
    this.otpcountdown = null;
  }

  componentDidMount(){
    // console.log(toJS(this.props.settingStore.settings.security.selectedlist))
    this.props.securityStore.setTotalSecuritySteper(this.props.settingStore.settings.security.selectedlist.length);
    // this._checkTouchID();
    this.autoUpdateDisposer = autorun(() => {
      // console.log("autorun")
      // var selectedsecurity = this.props.settingStore.settings.security.selected;
      // var selectedsecuritylist = toJS(this.props.settingStore.settings.security.selectedlist);
      var selectedsecuritylist_reverse = toJS(this.props.settingStore.settings.security.selectedlist).reverse();
      var selectedsecuritysteper = this.props.securityStore.selectedsecuritysteper;
      var currentsecuritytype = selectedsecuritylist_reverse[selectedsecuritysteper - 1];
      this.props.securityStore.checkSecurityTypeForSMS(currentsecuritytype);
      // console.log("currentsecuritytype", currentsecuritytype , selectedsecuritysteper, this.state.requestedotp, this.state.startresendOTP)
      // console.log("this.props.securityStore.requestverify", this.props.securityStore.requestverify)
      if(this.props.securityStore.requestverify){
        if(!this.state.requestedotp && !this.state.startresendOTP && selectedsecuritysteper > 0){
          // console.log("selectedsecurity", selectedsecurity)
          this._requestOTP();
          if(currentsecuritytype == "OneTimePassword"){
            console.log("OneTimePassword !!")
            // this._requestOTP();
          }
          if(currentsecuritytype == "TwoFactorAuthentication"){
            console.log("TwoFactorAuthentication !!")
            // this._callRequestAPI();
          }
          if(currentsecuritytype == "Pincode"){
            console.log("Pincode !!")
            this.props.navigation.navigate("PinCode",{isverify:true});
          }
          if(currentsecuritytype == "BiometricAuthentication"){
            console.log("BiometricAuthentication !!")
            this._TouchIDInit();
          }
        }
      }else{
        this.setState({
          requestedotp:false,
          startresendOTP:false,
        });
      }
      if(this.props.securityStore.securityCompState){
        // console.log("set to false !")
        this.setState({
          requestedotp:false,
          startresendOTP:false,
        });
      }
    });
    // reaction(()=> this.props.securityStore.securityCompState, () =>{
    //   console.log("set to false !")
    //   this.setState({
    //     requestedotp:false,
    //     startresendOTP:false,
    //   });
    // })
  }

  componentWillUnmount(){
    try{
      this.autoUpdateDisposer();
      this.props.securityStore.resetEverythings();
      if(this.props.securityStore.smsnotification){
        clearInterval(this.otpcountdown);
      }
    }catch(e){
      
    }
  }

  _requestOTP = () =>{
    this.setState({
      requestedotp:true,
      startresendOTP:true,
    },()=>{
      // console.log(this.props.securityStore.smsnotification)
      if(this.props.securityStore.smsnotification){
        this.Timer(120);
      }
      this._callRequestAPI();
    })
  }

  _callRequestAPI = () =>{
    let apiURL = "";
    if(this.props.securityStore.OTPType == "PersonalProfile"){
      apiURL = "api/auth/RequestUpdateProfileTokenOTPByEmail";
    }
    if(this.props.securityStore.OTPType == "Send"){
      apiURL = "api/auth/RequestTransferTokenOTPByEmail";
    }
    // console.log("this.props.securityStore.smsnotification", this.props.securityStore.smsnotification)
    var formdata = new FormData();
    formdata.append('token', this.props.settingStore.acctoken);
    formdata.append('emailnotification', this.props.securityStore.smsnotification);
    callApi(apiURL,formdata,(response)=>{
      // console.log(response);
      if(response.status == 200){
        this.props.securityStore.setReceivedOTPCode(response.otp,response.token);
      }else{
        showMessage({
          message: intl.get('Error.' + response.msg),
          type: "warning",
          icon:"warning"
        });
      }
    },(response)=>{
      // console.log(response);
      clearInterval(this.otpcountdown);
      this.setState({
        requestedotp:false,
        countdownvalue:""
      },()=>{
        showMessage({
          message: intl.get('Error.Unknow'),
          type: "danger",
          icon:"danger",
        });
      })
    })  
  }

  Timer = (duration) =>{ // in second
    clearInterval(this.otpcountdown);
    var timer = duration, minutes, seconds;
    this.otpcountdown = setInterval(() =>{
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        this.setState({
          countdownvalue:minutes + ":" + seconds
        },()=>{
          if(timer === 119){
            this.props.parentscrollEnd ? this.props.parentscrollEnd() : null;
          }
        })
        if (--timer < 0) {
          clearInterval(this.otpcountdown);
          this.setState({
            requestedotp:false,
            countdownvalue:""
          })
            // timer = duration;
        }
    }, 1000);
  }

  // _checkTouchID = () =>{
  //   const optionalConfigObject = {
  //     unifiedErrors: false, // use unified error messages (default false)
  //     passcodeFallback: false // if true is passed, itwill allow isSupported to return an error if the device is not enrolled in touch id/face id etc. Otherwise, it will just tell you what method is supported, even if the user is not enrolled.  (default false)
  //   }
  //   TouchID.isSupported(optionalConfigObject)
  //   .then(biometryType => {
  //     if(biometryType){
  //       this.setState({
  //         supporttouchid:true
  //       })
  //     }
  //     console.log(biometryType);
  //     // Success code
  //     if (biometryType === 'FaceID') {
  //         console.log('FaceID is supported.');
  //     } else {
  //         console.log('TouchID is supported.');
  //         // this._TouchIDInit();
  //     }
  //   })
  //   .catch(error => {
  //     // Failure code
  //     console.log(error);
  //   });
  // }

  _TouchIDInit = () =>{
    var settings = this.props.settingStore.settings;
    const optionalConfigObject = {
      title: intl.get('Security.AuthenticationRequired'), // Android
      imageColor: '#3834D8', // Android
      imageErrorColor: '#ff0000', // Android
      sensorDescription: intl.get('Security.TouchSensor'), // Android
      sensorErrorDescription: intl.get('Common.Failed'), // Android
      cancelText: intl.get('Common.Cancel'), // Android
      normalError:intl.get('Security.NotrecognizedTryAgain'),
      manyAttemptsError:intl.get('Security.ToomanyattemptsTryagainLater'),
      fallbackLabel: 'Show Passcode', // iOS (if empty, then label is hidden)
      unifiedErrors: false, // use unified error messages (default false)
      passcodeFallback: false, // iOS - allows the device to fall back to using the passcode, if faceid/touch is not available. this does not mean that if touchid/faceid fails the first few times it will revert to passcode, rather that if the former are not enrolled, then it will use the passcode.
    };
    TouchID.authenticate(intl.get('Security.ConfirmFingerprintProceed'),optionalConfigObject)
    .then(success => {
      // Success code
      console.log("yeah !", settings.touchid);
      let currentsteper = this.props.securityStore.selectedsecuritysteper - 1;
      this.props.securityStore.setTotalSecuritySteper(currentsteper);
      this.props.securityStore.updateSecurityCompState(true);
      if(currentsteper == 0){
        this.props.securityStore.onProceedSuccess();
      }else{
        this.setState({
          requestedotp:false,
          startresendOTP:false,
        })
      }
    })
    .catch(error => {
      // Failure code
      console.log("Touch ID failed :" + error);
        this.props.securityStore.setRequestVerify(false);
        this.props.securityStore.setTotalSecuritySteper(this.props.settingStore.settings.security.selectedlist.length);
        this.props.securityStore.updateSecurityCompState(true);
      // console.log(this.props.securityStore.requestverify);
    });
  }

  render(){
    var selectedsecuritylist_reverse = toJS(this.props.settingStore.settings.security.selectedlist).reverse();
    var selectedsecuritysteper = this.props.securityStore.selectedsecuritysteper;
    var currentsecuritytype = selectedsecuritylist_reverse[selectedsecuritysteper - 1];
    if(currentsecuritytype == "OneTimePassword" && this.props.securityStore.requestverify){
      return(
        <Animatable.View animation={"fadeInUp"} useNativeDriver duration={300} style={styles.securityctn}>
          <Text style={styles.securitytt}>{intl.get('Security.YourwillreceiveyourOTPfrom',{phone:`(+${this.props.settingStore.accinfo.CountryCode + this.props.settingStore.accinfo.Mobile})`})}</Text>
          <View style={styles.twofacinputctn}>
            <TextInput style={styles.twofacinput} placeholder={intl.get('Security.EnterOTPCode')} placeholderTextColor={Color.textgrey} keyboardType={'number-pad'}
            onChangeText={(text)=> this.props.securityStore.setEnteredOTPCode(text)} />
            <Ripple style={[styles.requestbtn, this.state.requestedotp && this.state.countdownvalue != "" ? {opacity:0.5} : null]} 
              onPress={this.state.requestedotp && this.state.countdownvalue != "" ? null : ()=> this._requestOTP()}>
              <Text style={styles.authott}>{this.state.requestedotp && this.state.countdownvalue != "" ? this.state.countdownvalue : this.state.startresendOTP ? intl.get('Security.ResendOTP') : intl.get('Security.RequestOTP')}</Text>
              {/* <Text style={styles.authott}>{this.state.requestedotp && this.state.countdownvalue != "" ? intl.get('Security.ResendOTP') : this.state.startresendOTP ? intl.get('Security.ResendOTP') : intl.get('Security.RequestOTP')}</Text> */}
            </Ripple>
          </View>
          {/* {this.state.countdownvalue != "" ?
          <Text style={[styles.countdownvalue,{marginBottom:0}]}>{`${intl.get('Security.ResendOTPin')} ${this.state.countdownvalue}`}</Text>
          : null } */}
        </Animatable.View>
      )
    }
    if(currentsecuritytype == "TwoFactorAuthentication" && this.props.securityStore.requestverify){
      return(
        <Animatable.View animation={"fadeInUp"} useNativeDriver duration={300}  style={styles.securityctn}>
          <View style={styles.twofacinputctn}>
            <TextInput style={[styles.twofacinput,{marginRight:0}]} placeholder={intl.get('Common.Enter2FACode')} placeholderTextColor={Color.textgrey} keyboardType={'number-pad'}
            onChangeText={(text)=> this.props.securityStore.setEntered2FACode(text)} />
          </View>
        </Animatable.View>
      )
    }
    return null;
  }
}

{/* <View style={styles.twofacinputctn}>
  <TextInput style={styles.twofacinput} placeholder={intl.get('Common.Enter2FACode')} placeholderTextColor={Color.textgrey} keyboardType={'number-pad'}
  onChangeText={(text)=> this.setState({enterotpinput:text})} />
  <Ripple style={[styles.requestbtn, this.state.requestedotp && this.state.countdownvalue != "" ? {opacity:0.5} : null]} 
    onPress={this.state.requestedotp && this.state.countdownvalue != "" ? null : ()=> this._request2FA()}>
    <Text style={styles.authott}>{this.state.requestedotp && this.state.countdownvalue != "" ? intl.get('Common.Resend2FA') : this.state.startresend2fa ? intl.get('Common.Resend2FA') : intl.get('Common.Request2FA')}</Text>
  </Ripple>
</View> */}

export default SecurityComponent;

const styles = StyleSheet.create({
  securitytt:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    fontSize:14,
    paddingHorizontal:20,
    paddingBottom:15
  },
  securityctn:{
    // borderTopWidth:1,
    backgroundColor:'#000',
    paddingVertical:20,
    // position:'absolute',
    // bottom:0,
    width:'100%'
    // marginBottom:20
  },
  countdownvalue:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    textAlign:'center',
    alignSelf:'center',
    marginVertical:20,
    marginBottom:40,
    fontSize:14
  },
  twofacinput:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    borderRadius:10,
    minHeight:55, 
    color:"#fff",
    fontFamily:Config.regulartt,
    flex:1,
    marginRight:10
  },
  authott:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
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
  twofacinputctn:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row',
    marginHorizontal:20,
  },
});
