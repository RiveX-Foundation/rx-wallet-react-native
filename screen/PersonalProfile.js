import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, BottomButton, ScreenLoader, CountryPicker } from '../extension/AppComponents';
import SecurityComponent from '../extension/SecurityComponent';
import { Color, Config, callApi,validateEmail, checkCryptographic } from '../extension/AppInit';
import AccountInfoContext from '../context/AccountInfoContext'
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import Ripple from 'react-native-material-ripple';
import {showMessage} from "react-native-flash-message";
import AsyncStorage from '@react-native-community/async-storage';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@inject('walletStore')
@inject('settingStore')
@inject('securityStore')
@observer
class PersonalProfile extends Component {
  constructor(props){
    super(props);
    this.state = {
      usernameinput:this.props.settingStore.accinfo.LoginId,
      nameinput:this.props.settingStore.accinfo.Name,
      mobileinput:this.props.settingStore.accinfo.Mobile,
      emailinput:this.props.settingStore.accinfo.Email,
      passwordinput:"",
      retypepasswordinput:"",
      // verifyOTP:"",
      // enter2fainput:"",
      // countdownvalue:"",
      // requested2fa:false,
      selectedCoutryCode:"60",
      showhidecountrypicker:false,
      jwtoken:"",
      passwordmatch:false,
      showhidepassword:true
    }
  }

  componentDidMount(){
    // console.log(this.props.settingStore.accinfo.GenericAttributes.find(x => x.Key == "FirstName").Value)
    this.props.securityStore.setSecurityInit(this._onProceedSuccess,null);
    this.props.securityStore.setOTPType("PersonalProfile");
  }

  componentWillUnmount(){
    // clearInterval(this.otpcountdown);
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

  _savePersonalProfile = () =>{
    if(this.state.nameinput == "" || this.state.nameinput.length <= 5){
      showMessage({
        message: intl.get('Alert.NameTooShort'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    if(this.state.mobileinput == "" || isNaN(this.state.mobileinput)){
      showMessage({
        message: intl.get('Alert.MobileNumeric'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    if(this.state.emailinput == "" || !validateEmail(this.state.emailinput)){
      showMessage({
        message: intl.get('Alert.InvalidEmailAddress'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    // if((this.state.passwordinput != "" && this.state.passwordinput.length <= 6) && (this.state.retypepasswordinput != "" && this.state.retypepasswordinput.length <= 6)){
    //   showMessage({
    //     message: intl.get('Alert.PasswordTooShort'),
    //     type: "warning",
    //     icon:"warning"
    //   });
    //   return;
    // }
    if(this.state.passwordinput != "" && !checkCryptographic(this.state.passwordinput)){
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
        message: intl.get('Alert.PasswordNotMatch'),
        type: "warning",
        icon:"warning"
      });
      return;
    }

    if(!this.props.securityStore.requestverify){
      this.props.securityStore.setRequestVerify(true);
    }else{
      // console.log(this.props.securityStore.requestverify)
      // console.log("checkOTPValid", this.props.securityStore.checkOTPValid());
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
      // console.log(this.props.securityStore.receivedOTPJwToken);
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
    var formdata = new FormData();
    // formdata.append('token', this.props.settingStore.acctoken);
    formdata.append('token', this.props.securityStore.receivedOTPJwToken);
    formdata.append('loginid', this.state.usernameinput);
    formdata.append('name', this.state.nameinput);
    formdata.append('password', this.state.passwordinput);
    formdata.append('email', this.state.emailinput);
    formdata.append('countrycode', this.state.selectedCoutryCode);
    formdata.append('mobile', this.state.mobileinput);
    // console.log(this.props.settingStore.acctoken,this.state.nameinput, this.state.selectedCoutryCode, this.state.mobileinput,this.state.emailinput,this.state.passwordinput,this.state.retypepasswordinput);
    callApi("api/auth/UpdateCustomer",formdata, async(response)=>{
      this.screenloader.hide();
      console.log(response);
      if(response.status == 200){
        this.props.securityStore.resetEverythings();
        response.user.CountryCode = this.state.selectedCoutryCode;
        response.user.Mobile = this.state.mobileinput;
        await AsyncStorage.setItem('@accinfo', JSON.stringify({user:response.user,token:this.props.settingStore.acctoken})).then(()=>{
          showMessage({
            message: intl.get('Alert.SuccessfullyUpdated'),
            type: "success",
            icon:"success"
          });
          this.props.settingStore.setAccinfo(response.user);
          this.props.securityStore.resetEverythings();
          this.props.navigation.goBack();
        });
      }else{
        showMessage({
          message: intl.get('Error.' + response.msg),
          type: "warning",
          icon:"warning"
        });
      }
    },(response)=>{
      this.props.securityStore.resetEverythings();
      this.screenloader.hide();
      showMessage({
        message: intl.get('Error.Unknow'),
        type: "warning",
        icon:"warning"
      });
      console.log("error", response);
    })
  }

  _checkisvalidpass = (text) =>{
    this.setState({
      retypepasswordinput:text
    },()=>{
      if(this.state.passwordinput == this.state.retypepasswordinput){
        this.setState({
          passwordmatch:true
        })
      }else{
        this.setState({
          passwordmatch:false
        })
      }
    })
  }

  _ShowHidePass = () =>{
    this.setState({
      showhidepassword:!this.state.showhidepassword
    })
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={"Personal Profile"} isclosebtn/>
          <ScrollView ref={(r) => this.editprofile = r} keyboardShouldPersistTaps={'always'} >
            <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.UserName')}</Text>
              <TextInput style={styles.inputfield} onChangeText={(text)=> this.setState({usernameinput:text})} 
              value={this.state.usernameinput}/>
            </View>
            <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.YourName')}</Text>
              <TextInput style={styles.inputfield} onChangeText={(text)=> this.setState({nameinput:text})} 
              value={this.state.nameinput}/>
            </View>
            <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.MobileNumber')}</Text>
              <View style={styles.rowalign}>
                <Ripple style={styles.countryinput} onPress={()=> this._showhideCountryPicker()}>
                  <Text style={styles.whitelabel}>{`+${this.state.selectedCoutryCode}`}</Text>
                </Ripple>
                <TextInput style={styles.inputfield2} onChangeText={(text)=> this.setState({mobileinput:text})} 
                value={this.state.mobileinput} keyboardType={"number-pad"} />
              </View>
            </View>
            <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.EmailAddress')}</Text>
              <TextInput style={styles.inputfield} onChangeText={(text)=> this.setState({emailinput:text})} 
              value={this.state.emailinput} keyboardType={"email-address"} />
            </View>
            {/* <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.NewPassword')}</Text>
              <View style={styles.inputfield}>
                <TextInput style={styles.inputfieldpass} secureTextEntry onChangeText={(text)=> this.setState({passwordinput:text})} />
                {this.state.passwordinput != "" && this.state.retypepasswordinput != "" && this.state.passwordmatch ?
                <IoIcon name="md-checkmark" color="#53BC5B" size={17} />
                :null}
                {this.state.passwordinput != "" && this.state.retypepasswordinput != "" && !this.state.passwordmatch ?
                <RiveIcon name="gan-tan-hao" color={"#EF3333"} size={17} />
                :null}
              </View>
            </View> */}
            <View style={styles.inputfieldctn}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.NewPassword')}</Text>
              <View style={[styles.inputfield,{paddingHorizontal:0,paddingLeft:20}]}>
                <TextInput style={styles.inputfieldpass} secureTextEntry={this.state.showhidepassword} onChangeText={(text)=> this.setState({passwordinput:text})} />
                {this.state.passwordinput != "" ?
                <TouchableOpacity activeOpacity={1} style={[Config.visiblepassicon,{}]} onPress={()=> this._ShowHidePass()}>
                  <MaIcon name={this.state.showhidepassword ? "eye-off" : "eye"} color={"#fff"}  size={20}  />
                </TouchableOpacity>
                : null} 
              </View>
            </View>
            <View style={[styles.inputfieldctn,!this.state.requested2fa ? {marginBottom:20}: null]}>
              <Text style={styles.inputfieldtt}>{intl.get('Common.ConfirmNewPassword')}</Text>
              <View style={styles.inputfield}>
                <TextInput style={styles.inputfieldpass} secureTextEntry={this.state.showhidepassword} onChangeText={(text)=> this._checkisvalidpass(text)}/>
                {this.state.passwordinput != "" && this.state.retypepasswordinput != "" && this.state.passwordmatch ?
                <IoIcon name="md-checkmark" color="#53BC5B" size={17} />
                :null}
                {this.state.passwordinput != "" && this.state.retypepasswordinput != "" && !this.state.passwordmatch ?
                <RiveIcon name="gan-tan-hao" color={"#EF3333"} size={17} />
                :null}
              </View>
            </View>
            {/* {this.state.requested2fa ?
            <View style={styles.twofacinputctn}>
              <TextInput style={styles.twofacinput} placeholder={intl.get('Common.Enter2FACode')} placeholderTextColor={Color.textgrey} keyboardType={'number-pad'}
              onChangeText={(text)=> this.setState({enter2fainput:text})} />
              <Ripple style={[styles.requestbtn, this.state.requested2fa && this.state.countdownvalue != "" ? {opacity:0.5} : null]} 
                onPress={this.state.requested2fa && this.state.countdownvalue != "" ? null : ()=> this._request2FA()}>
                <Text style={styles.authott}>{this.state.requested2fa && this.state.countdownvalue != "" ? intl.get('Common.Resend2FA') : this.state.startresend2fa ? intl.get('Common.Resend2FA') : intl.get('Common.Request2FA')}</Text>
              </Ripple>
            </View>
            : null }
            {this.state.countdownvalue != "" ?
            <Text style={[styles.countdownvalue,{marginBottom:0}]}>{`${intl.get('Common.Resend2FAin')} ${this.state.countdownvalue}`}</Text>
            : null } */}
          </ScrollView>
          <SecurityComponent {...this.props} parentscrollEnd={()=> this.editprofile.scrollToEnd({animated: true})} />
          <BottomButton title={intl.get('Common.Save')} onPress={()=> this._savePersonalProfile()} />
        </LinearGradient>
        <ScreenLoader ref={(r) => this.screenloader = r}/>
        <CountryPicker isVisible={this.state.showhidecountrypicker} selectedCoutryCode={this.state.selectedCoutryCode}
        onBackButtonPress={()=> this._showhideCountryPicker()} onSelect={(code)=> this._onSelectedCountry(code)} />
      </SafeAreaView>
    );
  }
}

export default PersonalProfile;

const styles = StyleSheet.create({
  countryinput:{
    // width:'100%',
    // maxWidth:400,
    // backgroundColor:Color.rowblue,
    // borderRadius:10,
    // paddingHorizontal:20,
    // flexDirection:'row',
    // alignItems:'center',

    // color:"#fff",
    // fontFamily:Config.regulartt,
    // fontSize:14

    backgroundColor:Color.rowblue,
    minHeight:55,
    justifyContent:'center',
    marginRight:8,
    borderTopLeftRadius:10,
    borderBottomLeftRadius:10,
    width:70,
    justifyContent:'center',
    alignItems:'center',
    marginBottom:10,
  },
  rowalign:{
    flexDirection:"row",
    alignItems:"center"
  },
  inputfieldtt:{
    fontFamily:Config.regulartt,
    fontSize:14,
    color:"#fff",
    marginBottom:10
  },
  inputfieldpass:{
    flex:1,
    // backgroundColor:'#ccc',
    marginRight:20,
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  inputfield:{
    width:'100%',
    maxWidth:400,
    backgroundColor:Color.rowblue,
    borderRadius:10,
    paddingHorizontal:20,
    marginBottom:10,
    flexDirection:'row',
    alignItems:'center',
    minHeight:55,
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  inputfield2:{
    backgroundColor:Color.rowblue,
    minHeight:55,
    paddingHorizontal:20,
    borderTopRightRadius:10,
    borderBottomRightRadius:10,
    maxWidth:330,
    color:"#fff",
    flex:1,
    marginBottom:10,
  },
  inputfieldctn:{
    marginHorizontal:20,
    marginTop:20
  },
  whitelabel:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  btnctn:{
    marginHorizontal:20,
    alignItems:'flex-end',
    marginTop:10
  },
  btn:{
    backgroundColor:Color.deepblue,
    minHeight:55, 
    borderRadius:10,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:15,
    width:100
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
