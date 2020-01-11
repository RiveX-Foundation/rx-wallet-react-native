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
  ImageBackground,
  ScrollView
} from 'react-native';
import { TransBar, ProceedButton, CountryPicker,ReusedPicker } from '../extension/AppComponents';
import LinearGradient from 'react-native-linear-gradient';
import { Color,Config, callApi, isNullOrEmpty } from '../extension/AppInit';
import Fontisto from 'react-native-vector-icons/Fontisto'
import {showMessage} from "react-native-flash-message";
import AsyncStorage from '@react-native-community/async-storage';
import networks_json from '../extension/network.json';
import security_json from '../extension/security.json';
import Pushy from 'pushy-react-native';
import Ripple from 'react-native-material-ripple';
import IoIcon from 'react-native-vector-icons/Ionicons'
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import AccountInfoContext from '../context/AccountInfoContext';
import axios from 'axios';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import locales from '../locales';
import iWanUtils from '../utils/iwanUtils';
import { toJS } from 'mobx';
import { ethnetwork,wannetwork } from '../libs/network'

@inject('settingStore')
@inject('languageStore')
@inject('securityStore')
@observer
class Login extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedCoutryCode:"60",
      showhidecountrypicker:false,
      phonenumberinput:"",
      usernameinput:"",
      passwordinput:"",
      emailinput:"",
      checksubmit:false,
      loading:false,
      showhidelanguagepicker:false,
      defaultlang:"en_US",
      showhidepassword:true
    }
  }

  componentDidMount(){
    this._checkUserExist();
  }

  _checkUserExist = async() =>{
    try {
      const value = await AsyncStorage.getItem('@accinfo');
      // console.log(value);
      if(value !== null) {
        let accinfo = JSON.parse(value);
        this._checkDeviceToken(accinfo.token);
        this._checkSettingExist(accinfo.user.Id);
        this.props.settingStore.setAccinfo(accinfo.user);
        this.props.settingStore.setAccToken(accinfo.token);
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _checkSettingExist = async(accId) =>{
    try {
      const value = await AsyncStorage.getItem('@settings');
      if(value === null) {
        // console.log(accId)
        var settings = [];
        var newsetting = {
          Id:accId,
          notification:true,
          currency:"USD",
          ethnetwork:ethnetwork[0].shortcode,
          wannetwork:wannetwork[0].shortcode,
          language:this.state.defaultlang,
          security:{
            selected:security_json[0].name,
            selectedlist:[security_json[0].name],
            twofactor:"",
            pincode:"",
          }
        }
        // console.log(newsetting);
        settings.push(newsetting);
        // console.log(settings);
        await AsyncStorage.setItem('@settings', JSON.stringify(settings)).then(()=>{
          this._changeLanguage(newsetting.language);
          this.props.settingStore.setSettings(newsetting);
          this.props.settingStore.setBlockchainNetwork(newsetting.ethnetwork,"ethnetwork");
          this.props.settingStore.setBlockchainNetwork(newsetting.wannetwork,"wannetwork");
          this.props.navigation.navigate("App");
        })
      }else{
        // console.log(accId);
        var allsettings = JSON.parse(value);
        // console.log("allsettings",allsettings.some(x => x.Id == "5d4ef9c172dc2800e8ac477a"));
        // console.log("allsettings",JSON.stringify(allsettings), allsettings.length);
        if(JSON.stringify(allsettings).indexOf(accId) > -1){
          // console.log("come here 1")
          var mysetting = allsettings.filter(x => x.Id == accId)[0];
          if(mysetting.ethnetwork == undefined) mysetting.network = ethnetwork[0].shortcode;
          if(mysetting.wannetwork == undefined) mysetting.network = wannetwork[0].shortcode;
          if(mysetting.language == undefined) mysetting.language = this.state.defaultlang;
          // console.log(mysetting);
          this._changeLanguage(mysetting.language);
          this.props.settingStore.setSettings(mysetting);
          this.props.settingStore.setBlockchainNetwork(mysetting.ethnetwork,"ethnetwork");
          this.props.settingStore.setBlockchainNetwork(mysetting.wannetwork,"wannetwork");
          try{
            iWanUtils._checkswitchnetwork(toJS(this.props.settingStore.selectedWANNetwork));
          }catch(e){
            // console.log(e);
          }
          this.props.navigation.navigate("App");
        }else{
          // console.log("come here 2", accId)
          // console.log(allsettings)
          var newsetting = {
            Id:accId,
            notification:true,
            currency:"USD",
            ethnetwork:ethnetwork[0].shortcode,
            wannetwork:wannetwork[0].shortcode,
            language:this.state.defaultlang,
            security:{
              selected:security_json[0].name,
              selectedlist:[security_json[0].name],
              twofactor:"",
              pincode:"",
            }
          }
          allsettings.push(newsetting);
          // console.log(allsettings)
          await AsyncStorage.setItem('@settings', JSON.stringify(allsettings)).then(()=>{
            this._changeLanguage(newsetting.language);
            this.props.settingStore.setSettings(newsetting);
            this.props.settingStore.setBlockchainNetwork(newsetting.ethnetwork,"ethnetwork");
            this.props.settingStore.setBlockchainNetwork(newsetting.wannetwork,"wannetwork");
            this.props.navigation.navigate("App");
          })
        }
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _changeLanguage = (lan) => {
    // console.log("_changeLanguage", lan)
    intl.init({
      currentLocale: lan,
      locales
    }).then(() => {
      this.props.languageStore.setLanguage(lan);
    });
  }

  _changeAppStartLang = (lan) =>{
    // console.log(lan)
    this.setState({
      defaultlang:lan
    },()=>{
      this._changeLanguage(lan)
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

  _Login = () =>{
    this.setState({checksubmit:true,loading:true});
    var formdata = new FormData();
    // formdata.append('countrycode', this.state.selectedCoutryCode);
    // formdata.append('mobile', this.state.usernameinput);
    formdata.append('email', this.state.emailinput);
    formdata.append('password', this.state.passwordinput);
    callApi("api/auth/Login",formdata,(response)=>{
      console.log(response);
      if(response.status == 200){
        this.setState({
          loading:false
        },()=>{
          console.log(response.user);
          this._checkDeviceToken(response.token);
          this._storeLoginInfo({user:response.user,token:response.token});
          this.props.settingStore.setAccinfo(response.user);
          this.props.settingStore.setAccToken(response.token);
        });
      }else{
        this.setState({
          loading:false
        },()=>{
          showMessage({
            message: intl.get('Error.' + response.msg),//this._checkLoginReturn(response.msg),
            type: "danger",
            icon:"danger",
            // autoHide:false
          });
        })
      }
    },(response)=>{
      console.log(response);
      this.setState({
        loading:false
      },()=>{
        showMessage({
          message: intl.get('Error.Unknow'),
          type: "danger",
          icon:"danger",
        });
      });
    });
  }

  _checkDeviceToken = async(acctoken) =>{
    try {
      const value = await AsyncStorage.getItem('@devicetoken');
      if(value !== null) { // have
        this._registerPushy(acctoken,value);
      }else{
        this._registerPushy(acctoken,null);
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _registerPushy = async(acctoken,oldtoken) =>{
    // Register the device for push notifications
    Pushy.register().then(async (deviceToken) => {
      // Display an alert with device token
      console.log('Pushy device token: ' + deviceToken);
      if(oldtoken == null || oldtoken != deviceToken){
        var formdata = new FormData();
        formdata.append('token', acctoken);
        formdata.append('devicetoken', deviceToken);
        callApi("api/auth/UpdateDeviceToken",formdata, async(response)=>{
          if(response.status == 200){
            try {
              await AsyncStorage.setItem('@devicetoken', deviceToken);
            } catch (e) {
              // saving error
            }
          }
          // console.log("_registerPushy",response);
        },(response)=>{
          // console.log("_registerPushy Error",response);
        });
      }else{
        // console.log("skip register token")
      }
      // if(firsttime){
      //   this._subcribePushy();
      // }
      // Send the token to your backend server via an HTTP GET request
      //await fetch('https://your.api.hostname/register/device?token=' + deviceToken);

      // Succeeded, optionally do something to alert the user
    }).catch((err) => {
      // Handle registration errors
      console.error(err);
    })
  }

  // _checkLoginReturn(msg){
  //   let returnmsg = "";
  //   switch(msg){
  //     case "Usernotexist":
  //       returnmsg = "Account Not Exist";
  //     break;
  //     case "Userdeleted":
  //       returnmsg = "Account Deleted";
  //     break;
  //     case "Usernotactive":
  //       returnmsg = "Account Not Active";
  //     break;
  //     case "Usernotregistered":
  //       returnmsg = "Accouont Not Register";
  //     break;
  //     case "Userlocked":
  //       returnmsg = "Account Locked";
  //     break;
  //     case "Userwrongpassword":
  //       returnmsg = "Wrong Password";
  //     break;
  //     case "Wrongcredential":
  //       returnmsg = "Wrong Credential";
  //     break;
  //   }
  //   return returnmsg;
  // }

  _storeLoginInfo = async(accinfo) =>{
    try {
      await AsyncStorage.setItem('@accinfo', JSON.stringify(accinfo)).then(()=>{
        this._checkSettingExist(accinfo.user.Id);
        // this.props.navigation.navigate("App");
      });
    } catch (e) {
      // saving error
    }
  }

  _checkSubmition(type){
    if(type == "email"){ // type =="phone" // "username"
      if(this.state.checksubmit && this.state.emailinput == ""){
        return [Config.authinput,Config.inputerror]; //[Config.phoneinput,Config.inputerror];
      }else{
        return Config.authinput; //Config.phoneinput;
      }
    }
    // if(type =="pass"){
    //   if(this.state.checksubmit && this.state.passwordinput == ""){
    //     return [Config.authinput,Config.inputerror];
    //   }else{
    //     return Config.authinput;
    //   }
    // }
    if(type =="passctn"){
      if(this.state.checksubmit && this.state.passwordinput == ""){
        return [Config.authinputctn,Config.inputerror];
      }else{
        return Config.authinputctn;
      }
    }
  }

  _showhideLanguagePicker = ()=>{
    this.setState({
      showhidelanguagepicker:!this.state.showhidelanguagepicker
    })
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
        <ImageBackground source={require('../resources/loginbg.jpg')} style={[Config.imgbackground]} resizeMode="cover">
          <ScrollView contentContainerStyle={styles.indicatorscroll} keyboardShouldPersistTaps={'always'}>
            <Fontisto name={"language"} size={25} color={"#fff"} style={styles.languageicon} onPress={()=> this._showhideLanguagePicker()}/>
            <KeyboardAvoidingView style={[styles.aligncenter]} behavior="padding">
              <Text style={styles.hedaerwhitett}>{intl.get('Login.login')}</Text>
              {/* <View style={styles.rowalign}>
                <TouchableOpacity style={Config.countryinput} activeOpacity={0.9} onPress={()=> this._showhideCountryPicker()}>
                  <Text style={styles.whitett}>{`+${this.state.selectedCoutryCode}`}</Text>
                </TouchableOpacity>
                <TextInput keyboardType="number-pad" placeholder={intl.get('Common.MobileNumber')} onChangeText={(text) => this.setState({phonenumberinput:text})}
                  style={this._checkSubmition("phone")} placeholderTextColor="#fff" onSubmitEditing={()=> this._Login()}/>
              </View> */}
              <TextInput placeholder={`${intl.get('Common.UserName')} / ${intl.get('Common.EmailAddress')}`} style={this._checkSubmition("email")} placeholderTextColor="#fff"
              onChangeText={(text)=> this.setState({emailinput:text})} onSubmitEditing={()=> this._Login()}/>
              <View style={this._checkSubmition("passctn")}>
                <TextInput placeholder={intl.get('Common.Password')} secureTextEntry={this.state.showhidepassword } style={Config.passinput} placeholderTextColor="#fff"
                onChangeText={(text)=> this.setState({passwordinput:text})} onSubmitEditing={()=> this._Login()}/>
                <TouchableOpacity activeOpacity={1} style={Config.visiblepassicon} onPress={()=> this._ShowHidePass()}>
                  <MaIcon name={this.state.showhidepassword ? "eye-off" : "eye"} color={"#fff"}  size={20}  />
                </TouchableOpacity>
              </View>
              <View style={styles.leftright}>
                <TouchableOpacity onPress={()=> this.props.navigation.navigate("CreateAccount")}>
                  <Text style={[styles.bluegreentt,{fontSize:this.props.languageStore.language == "en_US" ? 12 : 14}]}>{intl.get('Login.CreateAccount')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=> this.props.navigation.navigate("ResetPassword")}>
                  <Text style={[styles.bluegreentt,{fontSize:this.props.languageStore.language == "en_US" ? 12 : 14}]}>{intl.get('Login.ForgotPassword')}</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
            <ProceedButton isload={this.state.loading} onPress={()=> this._Login()} />
          </ScrollView>
          {/* <LottieView source={require('../resources/doubletaptolike.json')} autoPlay loop /> */}
          {/* <ProceedButton onPress={()=> this.props.navigation.navigate("App")} /> */}
        </ImageBackground>
        <CountryPicker isVisible={this.state.showhidecountrypicker} selectedCoutryCode={this.state.selectedCoutryCode}
        onBackButtonPress={()=> this._showhideCountryPicker()} onSelect={(code)=> this._onSelectedCountry(code)} {...this.props} />
        <ReusedPicker title={intl.get('Settings.SelectLanguage')} isVisible={this.state.showhidelanguagepicker} onBackdropPress={()=> this._showhideLanguagePicker()}
        onBackButtonPress={()=> this._showhideLanguagePicker()}
        content={
          <View>
            {Object.keys(locales).map((lang,index)=>{
              return(
                <Ripple key={index} style={styles.countrypickeritem} onPress={()=> this._changeAppStartLang(lang)}>
                  <Text style={styles.countrypickertt}>{intl.get('Language.' + lang)}</Text>
                  {this.props.languageStore.language == lang ?
                  <IoIcon name="md-checkmark" color="#fff" size={15} />
                  : null }
                </Ripple>
              )
            })}
          </View>
        } />
      </View>
    );
  }
}

export default Login;  

const styles = StyleSheet.create({
  indicatorscroll:{
    height:Config.winheight - Config.statusBarHeight,
    justifyContent:'center',
    alignItems:'center'
  },
  countrypickertt:{
    fontSize:14,
    color:"#fff"
  },
  countrypickeritem:{
    borderBottomWidth:1,
    borderBottomColor:"#303554",
    padding:20,
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center"
  },
  languageicon:{
    position:'absolute',
    top:0,
    // top:Config.statusBarHeight,
    right:10,
    padding:10
  },
  languageiconctn:{
    height:40,
    width:40,
    // backgroundColor:'#000',
    justifyContent:'flex-end',
    alignItems:'center',
    flexDirection:'row',
    width:'100%',
    paddingRight:20
  },
  bluegreentt:{
    fontFamily:Config.regulartt,
    color:Color.lightbluegreen,
    fontSize:12
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
  whitett:{
    color:"#fff"
  },
  leftright:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    width:Config.winwidth * 0.8,
    maxWidth:400
  },
  rowalign:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:15
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
