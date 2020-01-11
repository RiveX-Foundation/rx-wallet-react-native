import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Switch
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, CurrencyPicker, ReusedPicker } from '../extension/AppComponents';
import { Color, Config, isNullOrEmpty } from '../extension/AppInit';
import security_json from '../extension/security.json';
import settings_json from '../extension/settings.json';
import networks_json from '../extension/network.json';
import IoIcon from 'react-native-vector-icons/Ionicons'
import TouchID from 'react-native-touch-id';
import SimpleIcon from 'react-native-vector-icons/SimpleLineIcons'
import AsyncStorage from '@react-native-community/async-storage';
import AccountInfoContext from '../context/AccountInfoContext';
import Ripple from 'react-native-material-ripple';
import Pushy from 'pushy-react-native';
import intl from 'react-intl-universal';
import locales from '../locales';
import { observer, inject } from 'mobx-react';
import {showMessage} from "react-native-flash-message";
import RiveIcon from '../extension/RiveIcon'

@inject('walletStore')
@inject('settingStore')
@inject('languageStore')
// @inject('securityStore')
@observer
class Security extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedsecurity:this.props.settingStore.settings.security.selected,
      supporttouchid:false,
      supportfaceid:false,
      selectedtoggle:[],
      showhidecurrencypicker:false,
      selectedcurrency:"USD",
      showhiderestorewalletpicker:false,
      showhidepincodemodal:false,
      showhidenetworkpicker:false,
      showhidelanguagepicker:false,
      selectedsecuritylist:this.props.settingStore.settings.security.selectedlist
    }
  }

  componentDidMount(){
    console.log("selectedsecuritylist", JSON.stringify(this.state.selectedsecuritylist))
    this._checkTouchID();
  }

  componentWillUnmount(){
    this.props.walletStore.setFromManageWallet(false);
    const {params} = this.props.navigation.state;
    params.refreshSetting ? params.refreshSetting() : null;
  }

  _refreshSecurity = () =>{
    var settings = this.props.settingStore.settings;
    // this.setState({
    //   selectedsecurity:settings.security.selected
    // },()=>{
    //   console.log(this.state.selectedsecurity)
    // })
    this.onSelectToList(settings.security.selected);
  }

  _checkPinCodeExist = async() =>{
    try {
      const value = await AsyncStorage.getItem('@settings');
      console.log(value)
      if(value !== null) {
        let allsettings = JSON.parse(value);
        let selectedsetting = allsettings.find(x => x.Id == this.props.settingStore.accinfo.Id);
        let indexsetting = allsettings.indexOf(selectedsetting);
        console.log(allsettings[indexsetting])
        if(allsettings[indexsetting].pincode.enable){
          this.setState({
            selectedtoggle:this.state.selectedtoggle.concat("pincode")
          });
        }
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  // _checkTouchIDExist = async() =>{
  //   try {
  //     const value = await AsyncStorage.getItem('@touchid');
  //     console.log(value);
  //     if(value !== null) {
  //       this.setState({
  //         selectedtoggle:this.state.selectedtoggle.concat("pincode")
  //       });
  //     }
  //   } catch(e) {
  //     console.log(e)
  //     // error reading value
  //   }
  // }

  onToggle = (value,key) =>{
    var settings = this.props.settingStore.settings;
    if(value){
      if(key == "notification"){
        this._enableNotification();
      }
      // if(key == "pincode"){
      //   this.props.navigation.navigate("PinCode", {verifyPin:this._enablePinDone})
      // }
      if(key == "touchid"){
        this._checkTouchID();
      }
    }else{
      if(key == "notification"){
        this._disableNotification();
      }
      // if(key == "pincode" && settings.pincode){
      //   this.props.navigation.navigate("PinCode", {verifyPin:this._disablePinDone})
      // }
      if(key == "touchid" && settings.touchid){
        this._checkTouchID();
      }
    }
    // this._updateStorageSetting();
  }

  _enableNotification = () =>{
    console.log("enable");
    this.setState({
      selectedtoggle:this.state.selectedtoggle.concat("notification")
    },()=>{
      // Pushy.toggleNotifications(true);
      // this.props.settingStore.setEnableNotification(true);
      this._updateStorageSetting(false);
    });
  }

  _disableNotification = () =>{
    console.log("disable");
    this.setState({
      selectedtoggle:this.state.selectedtoggle.filter(x=> x != "notification")
    },()=>{
      // Pushy.toggleNotifications(false);  
      // this.props.settingStore.setEnableNotification(false);
      this._updateStorageSetting(false);
    });
  }

  _enablePinDone = () =>{
    console.log("enable");
    // console.log(this.state.selectedtoggle);
    this.setState({
      selectedtoggle:this.state.selectedtoggle.concat("pincode")
    },()=>{
      // console.log(this.state.selectedtoggle);
      this._showhidePincodeModal();
      this._updateStorageSetting(false);
    });
  }

  _disablePinDone = () =>{
    console.log("disable");
    // console.log(this.state.selectedtoggle);
    this.setState({
      selectedtoggle:this.state.selectedtoggle.filter(x=> x != "pincode")
    },()=>{
      // console.log(this.state.selectedtoggle);
      this._showhidePincodeModal();
      this._updateStorageSetting(false);
    });
  }

  _updateStorageSetting = async() =>{
    try {
      const value = await AsyncStorage.getItem('@settings');
      if(value !== null){
        let allsettings = JSON.parse(value);
        let selectedsetting = allsettings.find(x => x.Id == this.props.settingStore.accinfo.Id);
        let indexsetting = allsettings.indexOf(selectedsetting);
        // console.log(allsettings,this.props.settingStore.accinfo.Id);
        allsettings[indexsetting].security.selected = this.state.selectedsecurity;
        allsettings[indexsetting].security.selectedlist = this.state.selectedsecuritylist;
        // allsettings[indexsetting].security.pincode = "";
        await AsyncStorage.setItem('@settings', JSON.stringify(allsettings)).then(()=>{
          console.log("allsettings", JSON.stringify(allsettings));
          this.props.settingStore.setSettings(allsettings[indexsetting]);
        });
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _checkTouchID = () =>{
    const optionalConfigObject = {
      unifiedErrors: false, // use unified error messages (default false)
      passcodeFallback: false // if true is passed, itwill allow isSupported to return an error if the device is not enrolled in touch id/face id etc. Otherwise, it will just tell you what method is supported, even if the user is not enrolled.  (default false)
    }
    TouchID.isSupported(optionalConfigObject)
    .then(biometryType => {
      if(biometryType){
        this.setState({
          supporttouchid:true
        })
      }
      console.log(biometryType);
      // Success code
      if (biometryType === 'FaceID') {
          console.log('FaceID is supported.');
      } else {
          console.log('TouchID is supported.');
          // this._TouchIDInit();
      }
    })
    .catch(error => {
      // Failure code
      console.log(error);
    });
  }

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
      // this.setState({
      //   selectedsecurity:"BiometricAuthentication",
      // },()=>{
      //   this._updateStorageSetting();
      // })
      this.onSelectToList("BiometricAuthentication");
    })
    .catch(error => {
      // Failure code
      console.log(error);
    });
  }

  _onSelectSecurity = (item) =>{
    if(item.name == "Pincode" && isNullOrEmpty(this.props.settingStore.settings.security.pincode)){
      this.props.navigation.navigate("PinCode",{isfirsttime:true,changepincode:false,isverify:false,refreshSecurity:this._refreshSecurity});
      return;
    }
    if(item.name == "BiometricAuthentication" && this.state.supporttouchid){
      this._TouchIDInit();
      return;
    }
    // this.setState({
    //   selectedsecurity:item.name,
    // },()=>{
    //   this._updateStorageSetting();
    // })
    this.onSelectToList(item.name);
  }
  // _onSelectSecurity = (item) =>{
  //   if(item.name  == "Pincode"){
  //     if(isNullOrEmpty(this.props.settingStore.settings.pincode.code)){
  //       this.props.navigation.navigate("PinCode",{isfirsttime:true,changepincode:false,isverify:false});
  //     }else{
  //       this._showhidePincodeModal();
  //     }
  //   }
  // }

  onSelectToList = (keyname) =>{
    if(this.state.selectedsecuritylist.some(x => x == keyname) === false){
      this.setState({
        selectedsecurity:keyname,
        selectedsecuritylist:this.state.selectedsecuritylist.concat(keyname)
      },()=>{
        console.log(this.state.selectedsecuritylist)
        this._updateStorageSetting();
      })
    }else{
      if(this.state.selectedsecuritylist.length > 1){
        this.setState({
          selectedsecuritylist:this.state.selectedsecuritylist.filter(x => x != keyname)
        },()=>{
          console.log(this.state.selectedsecuritylist)
          this._updateStorageSetting();
        })
      }else{
        showMessage({
          message: intl.get('Security.AtLeastOneVerification'),
          type: "warning",
          icon:"warning",
        });
      }
    }
  }
  

  renderItems({item,index}){
    if(item.name == "BiometricAuthentication" && !this.state.supporttouchid){
      return null;
    }
    let islast = false;
    return(
      <View>
        <TouchableOpacity key={index} activeOpacity={0.9} onPress={()=> this._onSelectSecurity(item)}
          style={[styles.sectionitemoption,this.state.selectedsecuritylist.indexOf(item.name) > -1 ? {borderBottomWidth:0} : {borderBottomWidth:1},item.type == "toggle" ? {paddingRight:10}:null]}>
          <View style={this.state.selectedsecuritylist.indexOf(item.name) > -1  ? styles.securitystepperctn : styles.securitystepperctn2}>
            {this.state.selectedsecuritylist.indexOf(item.name) > -1 ?
              <Text style={styles.securitystepper}>{this.state.selectedsecuritylist.indexOf(item.name) + 1}</Text>
            : null }
          </View>
          <Text style={styles.sectionitemoptiontt}>{intl.get('Security.' + item.name)}</Text>
          {/* {this.state.selectedsecurity == item.name ?
          <IoIcon name="md-checkmark" color="#fff" size={17} />
          : null } */}
        </TouchableOpacity>
        {this._renderSecurityDetail(item.name)}
      </View>
    )
  }


  _showhideCurrencyPicker = ()=>{
    this.setState({
      showhidecurrencypicker:!this.state.showhidecurrencypicker
    })
  }
  
  _showhideNetworkPicker = ()=>{
    this.setState({
      showhidenetworkpicker:!this.state.showhidenetworkpicker
    })
  }

  _showhideLanguagePicker = ()=>{
    this.setState({
      showhidelanguagepicker:!this.state.showhidelanguagepicker
    })
  }

  _onSelectCurrency = (currency) =>{
    this.setState({
      selectedcurrency:currency
    },()=>{
      this._showhideCurrencyPicker();
      this._updateStorageSetting(true);
    })
  }

  _showhidePincodeModal = () =>{
    this.setState({
      showhidepincodemodal:!this.state.showhidepincodemodal
    })
  }

  _showhideRestoreWalletPicker = () =>{
    this.setState({
      showhiderestorewalletpicker:!this.state.showhiderestorewalletpicker
    })
  }

  _OpenRestoreWallet = (type) =>{
    this._showhideRestoreWalletPicker();
    this.props.navigation.navigate("RestoreWallet",{type:type});
  }

  _AccountLogout = async () => {
    try {
      await AsyncStorage.removeItem('@accinfo').then(()=>{
        this.props.navigation.navigate("Auth");
      });
    } catch(e) {
      // remove error
    }
  
    console.log('Done.')
  }

  _changePincode = () =>{
    this._showhidePincodeModal();
    this.props.navigation.navigate("PinCode",{isfirsttime:false,changepincode:true,isverify:false})
  }


  _changeLanguage = (lan) => {
    // console.log("_changeLanguage", lan)
    intl.init({
      currentLocale: lan,
      locales
    }).then(() => {
      this.props.languageStore.setLanguage(lan);
      this._updateStorageSetting(false);
    });
  }

  _renderSecurityDetail = (type) =>{
    if(type == "OneTimePassword" && this.state.selectedsecuritylist.indexOf("OneTimePassword") > -1){
      return(
        <View style={[styles.sectionitemoption2]}>
          <Text style={styles.sectionitemoptiontt2}>
            {intl.get('Security.OneTimePassword.Proceed')}
            {`(${this.props.settingStore.accinfo.CountryCode}${this.props.settingStore.accinfo.Mobile})`}
          </Text>
        </View>
      )
    }
    if(type == "TwoFactorAuthentication" && this.state.selectedsecuritylist.indexOf("TwoFactorAuthentication") > -1){
      return(
        <TouchableOpacity activeOpacity={0.9} style={[styles.sectionitemoption2]}
        onPress={()=> this.props.navigation.navigate("GoogleAuth")}>
          <Text style={styles.sectionitemoptiontt2}>
            {intl.get('Security.Setup2FAauthentication')}
          </Text>
          <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
        </TouchableOpacity>
      )
    }
    if(type == "Pincode" && this.state.selectedsecuritylist.indexOf("Pincode") > -1){
      // this.props.navigation.navigate("PinCode",{isfirsttime:true,changepincode:false,isverify:false});
      if(isNullOrEmpty(this.props.settingStore.settings.security.pincode)){
        return(
          <TouchableOpacity activeOpacity={0.9} onPress={this.props.settingStore.settings.security.pincode != "" ? ()=> this._disablePinDone() : ()=> this._enablePinDone()}
            style={[styles.sectionitemoption]}>
            <Text style={styles.sectionitemoptiontt2}>{intl.get('Security.SetupNewPinCode')}</Text>
            <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
          </TouchableOpacity>
        )
      }else{
        return(
          <TouchableOpacity activeOpacity={0.9} onPress={()=> this._changePincode()}
            style={[styles.sectionitemoption2]}>
            <Text style={styles.sectionitemoptiontt2}>{intl.get('Settings.ChangePincode')}</Text>
            <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
          </TouchableOpacity>
          // <View>
          //   <TouchableOpacity activeOpacity={0.9} onPress={()=> this._changePincode()}
          //     style={[styles.sectionitemoption]}>
          //     <Text style={styles.sectionitemoptiontt}>{intl.get('Settings.ChangePincode')}</Text>
          //     <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
          //   </TouchableOpacity>
          //   <TouchableOpacity activeOpacity={0.9} onPress={this.props.settingStore.settings.security.pincode != "" ? ()=> this._disablePinDone() : ()=> this._enablePinDone()}
          //     style={[styles.sectionitemoption,{borderBottomWidth:0}]}>
          //     <Text style={styles.sectionitemoptiontt}>{`${this.props.settingStore.settings.security.pincode != "" ? intl.get('Common.Disable') : intl.get('Common.Enable')}`} {intl.get('Settings.Pincode')}</Text>
          //     <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
          //   </TouchableOpacity>
          // </View>
        )
      }
    }
    if(type == "BiometricAuthentication" && this.state.selectedsecuritylist.indexOf("BiometricAuthentication") > -1){
      return(
        <View style={[styles.sectionitemoption2]}>
          <Text style={styles.sectionitemoptiontt2}>
          {intl.get('Security.BiometricAuthentication.Proceed')}
          </Text>
        </View>
      )
    }
  }

  render() {
    // console.log(this.props.settingStore.settings.pincode.code, this.props.settingStore.settings.pincode.enable)
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={intl.get('Settings.TransactionVerification').toUpperCase()} />
          <View style={{flex:1}}>
            <FlatList 
              data={security_json}
              extraData={this.state}
              keyExtractor={(item,index)=>index.toString()}
              renderItem={this.renderItems.bind(this)}
              removeClippedSubviews
            />
          </View>
          {/* <Text style={styles.sectionitemtt}>{intl.get('Security.' + this.state.selectedsecurity)}</Text> */}
          {/* {this._renderSecurityDetail()} */}
          <View style={styles.bottomnoticectn}>
            <RiveIcon name="gan-tan-hao" color={Color.lightbluegreen} size={17} />
            <Text style={[styles.greytt]}>{intl.get('Scurity.TransactionVerification.Notice',{total:this.props.settingStore.settings.security.selectedlist.length})}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default Security;  

const styles = StyleSheet.create({
  bottomnoticectn:{
    flexDirection:'row',
    alignSelf:'center',
    paddingVertical:20,
  },
  greytt:{
    color:Color.textgrey,
    textAlign:'center',
    width:'60%',
    alignSelf:'center',
    fontFamily:Config.regulartt
  },
  networkdot:{
    height:10,
    width:10,
    borderRadius:100,
    marginRight:10
  },
  networkdotctn:{
    flexDirection:'row',
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
  logouticon:{
    transform:[{
      rotate:"180deg"
    }]
  },
  togglebtn:{
    padding:0,
    // backgroundColor:"#ccc"
  },
  whitetext:{
    color:"#fff",
    fontFamily:Config.regulartt
  },  
  securitystepperctn2:{
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    height:23,
    width:23,
    backgroundColor:Color.rippleblueColor,
    borderRadius:100,
  },
  securitystepperctn:{
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    height:23,
    width:23,
    backgroundColor:Color.deepblue,
    borderRadius:100,
  },
  securitystepper:{
    color:'#fff',
    fontFamily:Config.regulartt,
    fontSize:13
  },
  sectionitemoptiontt2:{
    color:Color.textgrey,
    fontFamily:Config.regulartt
  },
  sectionitemoptiontt:{
    // color:Color.textgrey,
    color:"#fff",
    fontFamily:Config.regulartt,
    marginLeft:20
  },
  sectionitemoption2:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    borderBottomColor:"#3c4064",
    borderBottomWidth:1,
    flexDirection:"row",
    alignItems:'center',
    justifyContent:'space-between',
    minHeight:51
  },
  sectionitemoption:{
    // backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    borderBottomColor:"#3c4064",
    borderBottomWidth:1,
    flexDirection:"row",
    alignItems:'center',
    // justifyContent:'space-between',
    minHeight:60
  },
  sectionitemtt:{
    color:"#fff",
    paddingVertical:20,
    paddingHorizontal:20,
    fontFamily:Config.regulartt
  },
  sectionitem:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    paddingRight:20
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
