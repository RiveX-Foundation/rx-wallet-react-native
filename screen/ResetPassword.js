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
  ScrollView,
  Alert
} from 'react-native';
import { TransBar, CountryPicker, ProceedButton, IndicatorTopHeader } from '../extension/AppComponents';
import LinearGradient from 'react-native-linear-gradient';
import { Color, Config, isNullOrEmpty, callApi, checkCryptographic , validateEmail} from '../extension/AppInit';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import {showMessage} from "react-native-flash-message";
import intl, { init } from 'react-intl-universal';
import { observer, inject } from 'mobx-react';

@inject('settingStore')
@inject('languageStore')
@observer
class ResetPassword extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentindex:0,
      selectedCoutryCode:"60",
      showhidecountrypicker:false,
      phonenumberinput:"",
      emailaddressinput:"",
      checksubmit:false,
      countdowntimer:"",
      countdownotptime:"",
      otpinput_1:"",
      otpinput_2:"",
      otpinput_3:"",
      otpinput_4:"",
      otpinput_5:"",
      otpinput_6:"",
      passwordinput:"",
      retypepasswordinput:"",
      requestedotp:false,
      verifyOTP:""
    }
    this.otpinput_ = [];
  }

  componentDidMount(){
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackPressPass);
    }
  }

  stepBackPressPass = () =>{
    this._stepGoBackPass();
    return true;
  }

  _stepGoBackPass = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.resetpasstab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
      if(currentindex == 0 && Platform.OS == "android"){
        BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressPass);
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

  _checkSubmition(type){
    if(type =="phone"){
      if(this.state.checksubmit && this.state.currentindex == 0 && this.state.phonenumberinput == ""){
        return [Config.phoneinput,Config.inputerror];
      }else{
        return Config.phoneinput;
      }
    }
    if(type == "email"){
      if(this.state.checksubmit && this.state.currentindex == 0 && (this.state.emailaddressinput == "" || !validateEmail(this.state.emailaddressinput))){
        return [Config.authinput,Config.inputerror];
      }else{
        return Config.authinput;
      }
    }
    if(type.indexOf("otp") > -1){
      let index = type.split("otp")[1];
      if(this.state.checksubmit && this.state.currentindex == 1 && this.state[`otpinput_${index}`] == ""){
        return [Config.otpitem,Config.inputerror]
      }
      return Config.otpitem;
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
    console.log(enterotp, this.state.jwtoken)
    callApi("api/auth/VerifyMobileOTP",formdata,(response)=>{
      // console.log(response)
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
          this.resetpasstab.setPage(2);
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

  _RequestForgotPassword = () =>{
    this.setState({checksubmit:true,loading:true});
    if(isNullOrEmpty(this.state.phonenumberinput)){
      showMessage({
        message: intl.get('Alert.EmptyMobileNumber'),
        type: "danger",
        icon:"danger"
      });
      return;
    }
    var formdata = new FormData();
    formdata.append('countrycode', this.state.selectedCoutryCode);
    formdata.append('mobile', this.state.phonenumberinput);
    // console.log(this.state.selectedCoutryCode + this.state.phonenumberinput)
    callApi("api/auth/RequestForgotPassword",formdata,(response)=>{
      console.log(response);
      if(response.status == 200){
        this._removeCheckSubmit({
          // phonenumberinput:"",
          jwtoken:response.token,
          loading:false,
          verifyOTP:response.otp
        },()=>{
          this.resetpasstab.setPage(1);
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

  _RequestForgotPassword_Email = () =>{
    this.setState({checksubmit:true,loading:true});
    if(isNullOrEmpty(this.state.emailaddressinput)){
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
    if(!validateEmail(this.state.emailaddressinput)){
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
    formdata.append('email', this.state.emailaddressinput);
    formdata.append('emailnotification', true);
    callApi("api/auth/RequestForgotPasswordByEmail",formdata,(response)=>{
      console.log(response);
      if(response.status == 200){
        this._removeCheckSubmit({
          jwtoken:response.token,
          loading:false,
          verifyOTP:response.otp
        },()=>{
          this.resetpasstab.setPage(1);
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

  _resendOTP = () =>{
    var formdata = new FormData();
    formdata.append('countrycode', this.state.selectedCoutryCode);
    formdata.append('mobile', this.state.phonenumberinput);
    formdata.append('smsnotification', true);
    callApi("api/auth/RequestForgotPassword",formdata,(response)=>{
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

  _removeCheckSubmit = (extra,cb) =>{
    this.setState({
      checksubmit:false,
      ...extra
    },cb);
  }

  _ResetPassword = () =>{
    // if(this.state.passwordinput <= 6 || this.state.retypepasswordinput.length <= 6){
    //   showMessage({
    //     message: intl.get('Alert.PasswordTooShort'),
    //     type: "danger",
    //     icon:"danger"
    //   });
    //   return;
    // }
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
      return;
    }
    this.setState({checksubmit:true,loading:true});
    var formdata = new FormData();
    formdata.append('newpassword', this.state.passwordinput);
    formdata.append('token', this.state.jwtoken);
    callApi("api/auth/ChangePassword",formdata,(response)=>{
      // console.log(response)
      Alert.alert(JSON.stringify(response));
      if(response.status == 200){
        this._removeCheckSubmit({
          loading:false
        },()=>{
          this.props.navigation.goBack();
          showMessage({
            message: intl.get('Alert.ResetSuccessfully'),
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
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TransBar />
        <ImageBackground source={require('../resources/loginbg.jpg')} style={Config.imgbackground} resizeMode="cover">
        <IndicatorTopHeader index={this.state.currentindex} noback={this.state.currentindex == 0 ? true : false} {...this.props} backfunc={()=> this._stepGoBackPass()} />
          <IndicatorViewPager ref={(r) => this.resetpasstab = r}  style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.indicatorChild}>
              <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps="always">
                <Text style={styles.hedaerwhitett}>{intl.get('ResetPass.RESETPASSWORD')}</Text>
                <KeyboardAvoidingView>
                  {/* <View style={styles.rowalign}>
                    <TouchableOpacity style={Config.countryinput} activeOpacity={0.9} onPress={()=> this._showhideCountryPicker()}>
                      <Text style={styles.whitett}>{`+${this.state.selectedCoutryCode}`}</Text>
                    </TouchableOpacity>
                    <TextInput keyboardType="number-pad" placeholder={intl.get('Common.MobileNumber')} onChangeText={(text) => this.setState({phonenumberinput:text})}
                    style={this._checkSubmition("phone")} placeholderTextColor="#fff" onSubmitEditing={()=> this._RequestForgotPassword()}/>
                  </View> */}
                  <TextInput keyboardType="email-address" placeholder={intl.get('Common.EmailAddress')} onChangeText={(text) => this.setState({emailaddressinput:text})}
                    style={this._checkSubmition("email")} placeholderTextColor="#fff" onSubmitEditing={()=> this._RequestForgotPassword_Email()}/>
                  <TouchableOpacity style={styles.bluegreenctn} activeOpacity={0.9} onPress={()=> this.props.navigation.goBack()}>
                    <Text style={[styles.bluegreentt,{fontSize:this.props.languageStore.language == "en_US" ? 12 : 14}]}>{intl.get('Common.BACKTOLOGIN')}</Text>
                  </TouchableOpacity>
                </KeyboardAvoidingView>
                <ProceedButton isload={this.state.loading} onPress={()=> this._RequestForgotPassword_Email()} />
              </ScrollView>
            </View>
            <View style={styles.indicatorChild}>
              <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps="always">
                <Text style={styles.hedaerwhitett}>{intl.get('ResetPass.RESETPASSWORD')}</Text>
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
                <Text style={styles.hedaerwhitett}>{intl.get('ResetPass.RESETPASSWORD')}</Text>
                <Text style={[styles.opacitytt,{marginBottom:15}]}>{intl.get('ResetPass.EnterPassword')}</Text>
                <KeyboardAvoidingView>
                  <TextInput secureTextEntry placeholder={intl.get('Common.NewPassword')} style={this._checkSubmition("pass")} placeholderTextColor="#fff" 
                    onChangeText={(text)=> this.setState({passwordinput:text})} />
                  <TextInput secureTextEntry placeholder={intl.get('Common.ConfirmNewPassword')} style={this._checkSubmition("pass")} placeholderTextColor="#fff"
                    onChangeText={(text)=> this.setState({retypepasswordinput:text})}/>
                </KeyboardAvoidingView>
                <ProceedButton isload={this.state.loading} onPress={()=> this._ResetPassword()} />
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

export default ResetPassword;

const styles = StyleSheet.create({
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
  indicatorscroll:{
    height:Config.winheight - Config.statusBarHeight - 50,
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
