import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  BackHandler,
  ImageBackground,
  ScrollView
} from 'react-native';
import { TransBar, CountryPicker, ProceedButton, IndicatorTopHeader } from '../extension/AppComponents';
import LinearGradient from 'react-native-linear-gradient';
import { Color, Config, callApi, validateEmail, isNullOrEmpty,checkCryptographic } from '../extension/AppInit';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
// import CountryPicker from 'react-native-country-picker-modal'
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import {showMessage} from "react-native-flash-message";
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';

@inject('settingStore')
@inject('languageStore')
@inject('securityStore')
@observer
class CreateAccount extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentindex:0,
      selectedCoutryCode:"60",
      showhidecountrypicker:false,
      accepttnc:false,
      phonenumberinput:"",
      registeremailinput:"",
      checksubmit:false,
      countdowntimer:"",
      countdownotptime:"",
      otpinput_1:"",
      otpinput_2:"",
      otpinput_3:"",
      otpinput_4:"",
      otpinput_5:"",
      otpinput_6:"",
      nameinput:"",
      usernameinput:"",
      emailinput:"",
      passwordinput:"",
      retypepasswordinput:"",
      jwtoken:"",
      loading:false,
      requestedotp:false,
      verifyOTP:"123456",
      googleauthkey:"",
      showhidepassword:true
    }
    this.otpinput_ = [];
  }

  componentDidMount(){
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackPressAcc);
    }
    this._getGoogleAuthKey();
  }

  componentWillUnmount(){
    clearInterval(this.state.countdowntimer);
  }

  _getGoogleAuthKey = () =>{
    var authkey = this.props.securityStore.generateGoogleAuthSecret();
    // console.log(authkey)
    this.setState({
      googleauthkey:authkey.base32
    })
  }

  stepBackPressAcc = () =>{
    this._stepGoBackAcc();
    return true;
  }

  _stepGoBackAcc = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.createacctab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
      if(currentindex == 0 && Platform.OS == "android"){
        BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressAcc);
      }
    }
    if(currentindex != 2){
      clearInterval(this.state.countdowntimer);
    }
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  _showhideCountryPicker = () =>{
    this.setState({
      showhidecountrypicker:!this.state.showhidecountrypicker
    })
  }

  _onSelectedCountry = (code) =>{
    // console.log(code);
    this.setState({
      selectedCoutryCode:code
    },()=>{
      this._showhideCountryPicker();
    })
  }

  acceptTNC = () =>{
    this.setState({
      accepttnc:!this.state.accepttnc
    })
  }

  // _createAccount_Number = () =>{
  //   this.setState({checksubmit:true,loading:true});
  //   if(isNullOrEmpty(this.state.phonenumberinput)){
  //     showMessage({
  //       message: intl.get('Alert.EmptyMobileNumber'),
  //       type: "warning",
  //       icon:"warning"
  //     });
  //     return;
  //   }
  //   var formdata = new FormData();
  //   formdata.append('countrycode', this.state.selectedCoutryCode);
  //   formdata.append('mobile', this.state.phonenumberinput);
  //   formdata.append('smsnotification', true);
  //   callApi("api/auth/RegisterMobileOTP",formdata,(response)=>{
  //     console.log(response);
  //     if(response.status == 200){
  //       this._removeCheckSubmit({
  //         // phonenumberinput:"",
  //         jwtoken:response.token,
  //         loading:false,
  //         requestedotp:true,
  //         verifyOTP:response.otp
  //       },()=>{
  //         this.createacctab.setPage(1);
  //         this.Timer(120);
  //       })
  //     }else{
  //       this.setState({
  //         loading:false
  //       },()=>{
  //         showMessage({
  //           message: intl.get('Error.' + response.msg),
  //           type: "danger",
  //           icon:"danger"
  //         });
  //       })
  //     }
  //   });
  // }

  _createAccount_Email = () =>{
    this.setState({checksubmit:true,loading:true});
    if(isNullOrEmpty(this.state.registeremailinput)){
      this.setState({
        loading:false
      },()=>{
        showMessage({
          message: intl.get('Alert.InvalidEmailAddress'),
          type: "warning",
          icon:"warning"
        });
      })
      return;
    }
    if(!validateEmail(this.state.registeremailinput)){
      this.setState({
        loading:false
      },()=>{
        showMessage({
          message: intl.get('Alert.InvalidEmailAddress'),
          type: "warning",
          icon:"warning"
        });
      })
      return;
    }
    var formdata = new FormData();
    formdata.append('email', this.state.registeremailinput);
    formdata.append('emailnotification', true);
    callApi("api/auth/RegisterEmailOTP",formdata,(response)=>{
      console.log(response);
      if(response.status == 200){
        this._removeCheckSubmit({
          jwtoken:response.token,
          loading:false,
          requestedotp:true,
          verifyOTP:response.otp
        },()=>{
          this.createacctab.setPage(1);
          this.Timer(120);
        })
      }else{
        this.setState({
          loading:false
        },()=>{
          showMessage({
            message: intl.get('Error.' + response.msg),
            type: "danger",
            icon:"danger"
          });
        })
      }
    });
  }

  // _resendOTP = () =>{
  //   var formdata = new FormData();
  //   formdata.append('countrycode', this.state.selectedCoutryCode);
  //   formdata.append('mobile', this.state.phonenumberinput);
  //   callApi("api/auth/RegisterMobileOTP",formdata,(response)=>{
  //     console.log(response);
  //     if(response.status == 200){
  //       this._removeCheckSubmit({
  //         jwtoken:response.token,
  //         requestedotp:true,
  //         loading:false
  //       },()=>{
  //         this.Timer(120);
  //       })
  //     }
  //   });
  // }

  _resendOTP = () =>{
    var formdata = new FormData();
    formdata.append('email', this.state.registeremailinput);
    formdata.append('emailnotification', true);
    callApi("api/auth/RegisterMobileOTP",formdata,(response)=>{
      console.log(response);
      if(response.status == 200){
        this._removeCheckSubmit({
          jwtoken:response.token,
          requestedotp:true,
          loading:false
        },()=>{
          this.Timer(120);
        })
      }
    });
  }

  _checkSubmition(type){
    if(type =="phone"){
      if(this.state.checksubmit && this.state.currentindex == 0 && this.state.phonenumberinput == ""){
        return [Config.phoneinput,Config.inputerror];
      }else{
        return Config.phoneinput;
      }
    }
    if(type.indexOf("otp") > -1){
      let index = type.split("otp")[1];
      if(this.state.checksubmit && this.state.currentindex == 1 && this.state[`otpinput_${index}`] == ""){
        return [Config.otpitem,Config.inputerror]
      }
      return Config.otpitem;
    }
    if(type == "name"){
      if(this.state.checksubmit && this.state.currentindex == 2 && (this.state.nameinput == "" || this.state.nameinput.length <= 5)){
        return [Config.authinput,Config.inputerror];
      }else{
        return Config.authinput;
      }
    }
    if(type == "username"){
      if(this.state.checksubmit && this.state.currentindex == 2 && (this.state.usernameinput == "" || this.state.usernameinput.length <= 5)){
        return [Config.authinput,Config.inputerror];
      }else{
        return Config.authinput;
      }
    }
    if(type == "email"){
      if(this.state.checksubmit && this.state.currentindex == 2 && (this.state.emailinput == "" || !validateEmail(this.state.emailinput))){
        return [Config.authinput,Config.inputerror];
      }else{
        return Config.authinput;
      }
    }
    if(type =="passctn"){
      if(this.state.checksubmit && this.state.passwordinput == ""){
        return [Config.authinputctn,Config.inputerror];
      }else{
        return Config.authinputctn;
      }
    }
    if(type == "pass"){
      if(this.state.checksubmit && this.state.currentindex == 2 && (this.state.passwordinput == "" || this.state.passwordinput.length <= 6)
        && (this.state.retypepasswordinput == "" || this.state.retypepasswordinput.length <= 6)){
        return [Config.authinput,Config.inputerror];
      }
      if(this.state.checksubmit && this.state.currentindex == 2 && this.state.passwordinput != this.state.retypepasswordinput){
        return [Config.authinput,Config.inputerror];
      }else{
        return Config.authinput;
      }
    }
  }

  // startTimer = (duration, display) => {
  //   clearInterval(this.state.countdowntimer);
  //   var timer = duration, minutes, seconds;
  //   this.state.countdowntimer = setInterval(() =>{
  //       minutes = parseInt(timer / 60, 10);
  //       seconds = parseInt(timer % 60, 10);
  
  //       minutes = minutes < 10 ? "0" + minutes : minutes;
  //       seconds = seconds < 10 ? "0" + seconds : seconds;
  
  //       display(`${minutes + ":" + seconds}`);
  
  //       if (--timer < 0) {
  //         clearInterval(this.state.countdowntimer);
  //       }
  //   }, 1000);
  // }

  Timer = (duration) =>{ // in second
    clearInterval(this.otpcountdown);
    var timer = duration, minutes, seconds;
    this.state.countdowntimer = setInterval(() =>{
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        this.setState({
          countdownotptime:minutes + ":" + seconds
        })
        if (--timer < 0) {
          clearInterval(this.state.countdowntimer);
          this.setState({
            requestedotp:false,
            countdownotptime:""
          })
            // timer = duration;
        }
    }, 1000);
  }

  onFocusChangeText = (value,from) =>{
    let newState = {};
    newState[`otpinput_${from}`] = value;
    this.setState(newState,()=>{
      if(isNullOrEmpty(value)){
        let back = from == 1 ? 1 : from - 1;
        this.otpinput_[back].focus();
      }else{
        from < 6 ? this.otpinput_[from + 1].focus() : null
      }
    });
  }

  _verifyOTP = () =>{
    this.setState({checksubmit:true,loading:true});
    let enterotp = this.state.otpinput_1 + this.state.otpinput_2 + this.state.otpinput_3 + this.state.otpinput_4 + this.state.otpinput_5 + this.state.otpinput_6;
    var formdata = new FormData();
    formdata.append('otp', enterotp);
    formdata.append('token', this.state.jwtoken);
    callApi("api/auth/VerifyMobileOTP",formdata,(response)=>{
      console.log(response)
      if(response.status == 200){
        this._removeCheckSubmit({
          otpinput_1:"",
          otpinput_2:"",
          otpinput_3:"",
          otpinput_4:"",
          otpinput_5:"",
          otpinput_6:"",
          jwtoken:response.token,
          loading:false
        },()=>{
          clearInterval(this.state.countdowntimer);
          this.createacctab.setPage(2);
        })
      }else{
        this.setState({
          loading:false
        },()=>{
          showMessage({
            message: intl.get('Error.' + response.msg),
            type: "danger",
            icon:"danger"
          });
        })
      }
    });
  }

  _SubmitRegistration = () =>{
    if(!this.state.accepttnc){
      showMessage({
        message: intl.get('Alert.TermsConditions'),
        type: "danger",
        icon:"danger"
      });
      return;
    }
    if(!this._checkSubmitionField()) return;
    this.setState({checksubmit:true,loading:true});
    var formdata = new FormData();
    formdata.append('name', this.state.nameinput);
    formdata.append('email', this.state.registeremailinput);
    // formdata.append('email', this.state.emailinput);
    formdata.append('loginid', this.state.usernameinput);
    formdata.append('password', this.state.passwordinput);
    formdata.append('token', this.state.jwtoken);
    formdata.append('googleauthkey', this.state.googleauthkey);
    callApi("api/auth/UpdateCustomerRegistration",formdata,(response)=>{
      console.log(response)
      if(response.status == 200){
        this._removeCheckSubmit({
          loading:false
        },()=>{
          this.props.navigation.goBack();
          showMessage({
            message: intl.get('Alert.RegisterSuccessfully'),
            type: "success",
            icon:"success"
          });
        })
      }else{
        this.setState({
          loading:false
        },()=>{
          showMessage({
            message: intl.get('Error.' + response.msg),
            type: "danger",
            icon:"danger"
          });
        })
      }
    },()=>{
      this.setState({
        loading:false
      });
    });
  }

  _checkSubmitionField = () =>{
    if(this.state.usernameinput.length <= 5){
      showMessage({
        message: intl.get('Alert.LoginIDTooShort'),
        type: "danger",
        icon:"danger"
      });
      return false;
    }
    if(!checkCryptographic(this.state.passwordinput)){
      showMessage({
        message:  intl.get('Alert.PasswordTips'),
        type: "danger",
        icon:"danger",
        duration:2300
      });
      return false;
    }
    if(this.state.passwordinput != this.state.retypepasswordinput){
      showMessage({
        message:  intl.get('Alert.PasswordNotMatch'),
        type: "danger",
        icon:"danger"
      });
      return false;
    }
    // if(this.state.nameinput.length <= 5){
    if(this.state.nameinput == ""){
      showMessage({
        message: intl.get('Alert.NameisEmpty'),
        type: "danger",
        icon:"danger"
      });
      return false;
    }
    // if(!validateEmail(this.state.emailinput)){
    //   showMessage({
    //     message: intl.get('Alert.InvalidEmailAddress'),
    //     type: "warning",
    //     icon:"warning"
    //   });
    //   return false;
    // }
    // if(this.state.emailinput <= 6){
    //   showMessage({
    //     message: "Password too short",
    //     type: "danger",
    //     icon:"danger"
    //   });
    //   return false;
    // }
    // if(this.state.passwordinput <= 6 || this.state.retypepasswordinput.length <= 6){
    //   showMessage({
    //     message:  intl.get('Alert.PasswordTooShort'),
    //     type: "danger",
    //     icon:"danger"
    //   });
    //   return false;
    // }
    return true;
  }

  _removeCheckSubmit = (extra,cb) =>{
    this.setState({
      checksubmit:false,
      ...extra
    },cb);
  }

  _ShowHidePass = () =>{
    this.setState({
      showhidepassword:!this.state.showhidepassword
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <TransBar />
        <ImageBackground source={require('../resources/loginbg.jpg')} style={Config.imgbackground} resizeMode="cover">
          <IndicatorTopHeader index={this.state.currentindex} noback={this.state.currentindex == 0 ? true : false} {...this.props} backfunc={()=> this._stepGoBackAcc()} />
          <IndicatorViewPager ref={(r) => this.createacctab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.indicatorChild}>
              <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps="always">
                <Text style={styles.hedaerwhitett}>{intl.get('CreateAccount.CREATEACCOUNT')}</Text>
                <KeyboardAvoidingView>
                  {/* <View style={styles.rowalign}>
                    <TouchableOpacity style={Config.countryinput} activeOpacity={0.9} onPress={()=> this._showhideCountryPicker()}>
                      <Text style={styles.whitett}>{`+${this.state.selectedCoutryCode}`}</Text>
                    </TouchableOpacity>
                    <TextInput keyboardType="number-pad" placeholder={intl.get('Common.MobileNumber')} onChangeText={(text) => this.setState({phonenumberinput:text})}
                    style={this._checkSubmition("phone")} placeholderTextColor="#fff" onSubmitEditing={()=> this._createAccount_Number()}/>
                  </View> */}
                  <TextInput keyboardType="email-address" placeholder={intl.get('Common.EmailAddress')} onChangeText={(text) => this.setState({registeremailinput:text})}
                    style={this._checkSubmition("email")} placeholderTextColor="#fff" onSubmitEditing={()=> this._createAccount_Email()}/>
                  <TouchableOpacity style={styles.bluegreenctn} activeOpacity={0.9} onPress={()=> this.props.navigation.goBack()}>
                    <Text style={[styles.bluegreentt,{fontSize:this.props.languageStore.language == "en_US" ? 12 : 14}]}>{intl.get('Common.BACKTOLOGIN')}</Text>
                  </TouchableOpacity>
                </KeyboardAvoidingView>
                <ProceedButton isload={this.state.loading} onPress={()=> this._createAccount_Email()} />
              </ScrollView>
            </View>
            <View style={styles.indicatorChild}>
              <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps="always">
                <Text style={styles.hedaerwhitett}>{intl.get('CreateAccount.CREATEACCOUNT')}</Text>
                <Text style={styles.opacitytt}>{intl.get('Common.KeyInOTP_Email')}</Text>
                <View style={styles.otpctn}>
                  <TextInput ref={(r) => this.otpinput_[1] = r} style={this._checkSubmition("otp1")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,1)} maxLength={1} />
                  <TextInput ref={(r) => this.otpinput_[2] = r} style={this._checkSubmition("otp2")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,2)} maxLength={1} />
                  <TextInput ref={(r) => this.otpinput_[3] = r} style={this._checkSubmition("otp3")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,3)} maxLength={1} />
                  <TextInput ref={(r) => this.otpinput_[4] = r} style={this._checkSubmition("otp4")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,4)} maxLength={1} />
                  <TextInput ref={(r) => this.otpinput_[5] = r} style={this._checkSubmition("otp5")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,5)} maxLength={1} />
                  <TextInput ref={(r) => this.otpinput_[6] = r} style={this._checkSubmition("otp6")} keyboardType="number-pad" onChangeText={(text)=> this.onFocusChangeText(text,6)} maxLength={1} />
                </View>
                {!isNullOrEmpty(this.state.countdownotptime) ?
                // <View style={{alignItems:'center'}}>
                //   <Text style={styles.opacitytt}>{intl.get('Common.RESENDOTP')} {this.state.countdownotptime}</Text>
                //   <Text style={styles.opacitytt}>(Beta Code - {this.state.verifyOTP})</Text>
                // </View>
                <Text style={styles.opacitytt}>{intl.get('Common.RESENDOTP')} {this.state.countdownotptime}</Text>
                :
                <TouchableOpacity activeOpacity={0.9} onPress={()=> this._resendOTP()}>
                  <Text style={[styles.opacitytt,{textDecorationLine:'underline'}]}>{intl.get('Common.RESENDOTP')}</Text>
                </TouchableOpacity>
                }
                <ProceedButton isload={this.state.loading} onPress={()=> this._verifyOTP()} />
              </ScrollView>
            </View>
            <View style={styles.indicatorChild}>
              <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps="always">
                <Text style={styles.hedaerwhitett}>{intl.get('CreateAccount.CREATEACCOUNT')}</Text>
                <KeyboardAvoidingView>
                  <TextInput placeholder={intl.get('Common.UserName')} style={this._checkSubmition("username")} placeholderTextColor="#fff" onChangeText={(text)=> this.setState({usernameinput:text})} />
                  <View style={this._checkSubmition("passctn")}>
                    <TextInput placeholder={intl.get('Common.Password')} secureTextEntry={this.state.showhidepassword } style={Config.passinput} placeholderTextColor="#fff"
                    onChangeText={(text)=> this.setState({passwordinput:text})} onSubmitEditing={()=> this._Login()}/>
                    <TouchableOpacity activeOpacity={1} style={Config.visiblepassicon} onPress={()=> this._ShowHidePass()}>
                      <MaIcon name={this.state.showhidepassword ? "eye-off" : "eye"} color={"#fff"}  size={20}  />
                    </TouchableOpacity>
                  </View>
                  <TextInput placeholder={intl.get('Common.ConfirmPassword')} style={this._checkSubmition("pass")} placeholderTextColor="#fff" secureTextEntry={this.state.showhidepassword } onChangeText={(text)=> this.setState({retypepasswordinput:text})}/>
                  <TextInput placeholder={intl.get('Common.FullName')} style={this._checkSubmition("name")} placeholderTextColor="#fff" onChangeText={(text)=> this.setState({nameinput:text})} />
                  {/* <TextInput placeholder={intl.get('Common.EmailAddress')} style={this._checkSubmition("email")} placeholderTextColor="#fff" keyboardType="email-address"  onChangeText={(text)=> this.setState({emailinput:text})} /> */}
                </KeyboardAvoidingView>
                <View style={styles.acceptctn}>
                  <TouchableOpacity style={styles.stepitem} activeOpacity={0.9} onPress={()=> this.acceptTNC()}>
                    {this.state.accepttnc ?
                    <View style={styles.stepitemdot}></View>
                    : 
                    <View style={styles.stepitemdot2}></View> 
                    }
                  </TouchableOpacity>
                  <Text style={[styles.opacitytt,{fontSize:13,marginLeft:10}]}>{intl.get('CreateAccount.ARGEETOTHE')} <Text style={[styles.bluegreentt,{textDecorationLine:'underline'}]}>{intl.get('CreateAccount.TERMSCONDITIONS')}</Text></Text>
                </View>
                <ProceedButton isload={this.state.loading} onPress={()=> this._SubmitRegistration()} style={{marginTop:40}}/>
              </ScrollView>
            </View>
          </IndicatorViewPager>
        </ImageBackground>
        <CountryPicker isVisible={this.state.showhidecountrypicker} selectedCoutryCode={this.state.selectedCoutryCode}
        onBackButtonPress={()=> this._showhideCountryPicker()} onSelect={(code)=> this._onSelectedCountry(code)} />
      </View>
    );
  }
}

export default CreateAccount;

const styles = StyleSheet.create({
  indicatorscroll:{
    height:Config.winheight - Config.statusBarHeight - 50,
    justifyContent:'center',
    alignItems:'center'
  },
  acceptctn:{
    alignItems:'center',
    flexDirection:'row',
    marginTop:10
  },
  stepitemdot2:{
    height:7,
    width:7,
    borderRadius:100,
    backgroundColor:'transparent'
  },
  stepitemdot:{
    height:7,
    width:7,
    borderRadius:100,
    backgroundColor:'#fff'
  },
  stepitem2:{
    borderWidth:1,
    borderColor:'transparent',
    borderRadius:100,
    padding:10
  },
  stepitem:{
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)',
    borderRadius:100,
    padding:6,
  },
  opacitytt:{
    color:'#9B9ECA',
    fontFamily:Config.regulartt
  },
  bluegreenctn:{
    marginTop:15
  },
  bluegreentt:{
    fontFamily:Config.regulartt,
    color:Color.lightbluegreen,
    fontSize:13
  },
  aligncenter:{
    justifyContent:'center',
    alignItems:'center'
  },
  hedaerwhitett:{
    fontFamily:Config.boldtt,
    fontSize:25,
    color:"#fff",
    marginBottom:40
  },
  otpctn:{
    flexDirection:"row",
    justifyContent:"center",
    alignContent:"center",
    alignItems:"center",
    paddingHorizontal:20,
    marginTop:20,
    marginBottom:20
  },
  indicatorChild:{
    flex:1
  },
  whitett:{
    color:"#fff"
  },
  leftright:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between"
  },
  rowalign:{
    flexDirection:"row",
    alignItems:"center"
  },
  linearGradient: {
    flex: 1,
    width:"100%",
    height:"100%",
    paddingTop:Config.statusBarHeight
  },
  container: {
    flex: 1
  }
});
