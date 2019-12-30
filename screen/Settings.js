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
import { toJS } from 'mobx';
import {ethnetwork,wannetwork, networkList} from '../libs/network'
import iWanUtils from '../utils/iwanUtils';

@inject('walletStore')
@inject('settingStore')
@inject('languageStore')
@observer
class Settings extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedtoggle:[],
      showhidecurrencypicker:false,
      selectedcurrency:"USD",
      showhiderestorewalletpicker:false,
      showhidepincodemodal:false,
      showhidenetworkpicker:false,
      showhidenetworktype:"",
      // oldnetwork:wannetwork[0],
      selectedETHNetwork:ethnetwork[0],
      selectedWANNetwork:wannetwork[0],
      showhidelanguagepicker:false,
      refreshSetting:true
    }
  }

  componentDidMount(){
    // console.log(this.props);
    this._checkAccountSetting();
  }

  componentWillUnmount(){
    this.props.walletStore.setFromManageWallet(false);
  }

  _checkAccountSetting = () =>{
    var settings = this.props.settingStore.settings;
    // console.log(settings.network)
    this.setState({
      selectedcurrency:settings.currency,
      // oldnetwork:networkList.find(x => x.shortcode == settings.network),
      selectedETHNetwork:ethnetwork.find(x => x.shortcode == settings.ethnetwork),
      selectedWANNetwork:wannetwork.find(x => x.shortcode == settings.wannetwork),
    })
    if(settings.notification){
      this.setState({
        selectedtoggle:this.state.selectedtoggle.concat("notification"),
      });
    }
    // let alltogglesetting = [];
    // settings_json.map((parent,i)=>{
    //   parent.list.map((child,k)=>{
    //     if(child.type == "toggle"){
    //       // console.log(child);
    //       alltogglesetting.push(child);
    //     }
    //   })
    // })
    // let currentavailable = [];
    // alltogglesetting.map((obj,n)=>{
    //   // console.log(obj.key,settings[obj.key]);
    //   if(settings[obj.key]){
    //     currentavailable.push(obj.key);
    //   }
    // })
    // if(settings.pincode.enable){
    //   currentavailable.push("pincode");
    // }
    // console.log("currentavailable", currentavailable)
    // this.setState({
    //   selectedtoggle:currentavailable,
    //   oldnetwork:networks_json.find(x => x.shortcode == settings.network)
    // });
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

  _updateStorageSetting = async(needreload) =>{
    try {
      const value = await AsyncStorage.getItem('@settings');
      if(value !== null){
        let allsettings = JSON.parse(value);
        let selectedsetting = allsettings.find(x => x.Id == this.props.settingStore.accinfo.Id);
        let indexsetting = allsettings.indexOf(selectedsetting);
        // console.log(allsettings,this.props.settingStore.accinfo.Id);
        allsettings[indexsetting].notification = this.state.selectedtoggle.indexOf("notification") > -1;
        // allsettings[indexsetting].pincode.enable = this.state.selectedtoggle.indexOf("pincode") > -1;
        // allsettings[indexsetting].touchid = this.state.selectedtoggle.indexOf("touchid") > -1;
        allsettings[indexsetting].currency = this.state.selectedcurrency;
        // allsettings[indexsetting].network = this.state.oldnetwork.shortcode;
        allsettings[indexsetting].ethnetwork = this.state.selectedETHNetwork.shortcode;
        allsettings[indexsetting].wannetwork = this.state.selectedWANNetwork.shortcode;
        allsettings[indexsetting].language = this.props.languageStore.language;
        await AsyncStorage.setItem('@settings', JSON.stringify(allsettings)).then(()=>{
          // console.log(JSON.stringify(allsettings));
          this.props.settingStore.setSettings(allsettings[indexsetting]);
          // this.props.settingStore.setBlockchainNetwork(this.state.oldnetwork);
          this.props.settingStore.setBlockchainNetwork(this.state.selectedETHNetwork.shortcode,"ethnetwork");
          this.props.settingStore.setBlockchainNetwork(this.state.selectedWANNetwork.shortcode,"wannetwork");
          this.props.walletStore.GetAllTokenAssetByNetwork(this.props.settingStore.acctoken,() => null,() => null);
          if(needreload){
            // this.props.walletStore.resetHomeBeforeLoadWallet();
            try{
              iWanUtils._checkswitchnetwork(toJS(this.props.settingStore.selectedWANNetwork));
            }catch(e){
              
            }
            this.props.walletStore.reloadWallet();
            this._GetAllTokenAssetByNetwork();
            this._GetPrimaryTokenAssetByNetwork();
          }
        });
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
  }

  _GetAllTokenAssetByNetwork = () =>{
    if(this.props.walletStore.allTokenAsset.length == 0){
      this.props.walletStore.GetAllTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
        // console.log(response)
      },(response)=>{
        console.log(response)
      });
    }
  }

  _GetPrimaryTokenAssetByNetwork = () =>{
    this.props.walletStore.GetPrimaryTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
      // console.log("_GetPrimaryTokenAssetByNetwork", toJS(this.props.walletStore.primaryTokenAsset))
    },(response)=>{
      console.log(response)
    })
  }

  _checkTouchID = () =>{
    const optionalConfigObject = {
      unifiedErrors: false, // use unified error messages (default false)
      passcodeFallback: false // if true is passed, itwill allow isSupported to return an error if the device is not enrolled in touch id/face id etc. Otherwise, it will just tell you what method is supported, even if the user is not enrolled.  (default false)
    }
    TouchID.isSupported(optionalConfigObject)
    .then(biometryType => {
      console.log(biometryType);
      // Success code
      if (biometryType === 'FaceID') {
          console.log('FaceID is supported.');
      } else {
          console.log('TouchID is supported.');
          this._TouchIDInit();
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
      title: 'RiveX Authentication Required', // Android
      imageColor: '#3834D8', // Android
      imageErrorColor: '#ff0000', // Android
      sensorDescription: 'Touch sensor', // Android
      sensorErrorDescription: 'Failed', // Android
      cancelText: 'Cancel', // Android
      fallbackLabel: 'Show Passcode', // iOS (if empty, then label is hidden)
      unifiedErrors: false, // use unified error messages (default false)
      passcodeFallback: false, // iOS - allows the device to fall back to using the passcode, if faceid/touch is not available. this does not mean that if touchid/faceid fails the first few times it will revert to passcode, rather that if the former are not enrolled, then it will use the passcode.
    };
    TouchID.authenticate("confirm fingerprint to continue",optionalConfigObject)
    .then(success => {
      // Success code
      console.log("yeah !", settings.touchid);
      if(settings.touchid){
        this.setState({
          selectedtoggle:this.state.selectedtoggle.filter(x=> x != "touchid")
        },()=>{
          this._updateStorageSetting(false);
        });
      }else{
        this.setState({
          selectedtoggle:this.state.selectedtoggle.concat("touchid")
        },()=>{
          this._updateStorageSetting(false);
        });
      }
    })
    .catch(error => {
      // Failure code
      // console.log(error);
    });
  }

  _onSettingPress = (listitem) =>{
    // listitem.name == "Currency" ? ()=> this._showhideCurrencyPicker() : !isNullOrEmpty(listitem.Route) ? ()=> this.props.navigation.navigate(listitem.Route) : null
    if(listitem.name  == "Currency"){
      this._showhideCurrencyPicker();
    }else if(listitem.name  == "ETHNetwork" || listitem.name  == "WANNetwork"){
      this._showhideNetworkPicker(listitem.name);
    }else if(listitem.Route  == "RestoreWallet"){
    }else if(listitem.name  == "Language"){
      this._showhideLanguagePicker();
    }else if(listitem.Route  == "RestoreWallet"){
      this._showhideRestoreWalletPicker();
    }else if(listitem.name  == "Pincode"){
      if(isNullOrEmpty(this.props.settingStore.settings.pincode.code)){
        this.props.navigation.navigate("PinCode",{isfirsttime:true,changepincode:false,isverify:false});
      }else{
        this._showhidePincodeModal();
      }
    }else{
      if(listitem.type == "content"){
        this.props.navigation.navigate("EasyContent",{selectedContent:listitem})
      }else{
        if(!isNullOrEmpty(listitem.Route)){
          this.props.navigation.navigate(listitem.Route,{refreshSetting:this._refreshSetting})
        }
      }
    }
  }

  _refreshSetting = () =>{
    this.setState({
      refreshSetting:true
    })
  }

  renderItems({item,index}){
    let islast = false;
    if(item.title == "Logout"){
      return(
        <TouchableOpacity style={styles.sectionitem} activeOpacity={0.9} onPress={()=> this._AccountLogout()}>
          <Text style={styles.sectionitemtt}>{intl.get('Settings.' + item.title)}</Text>
          <SimpleIcon name={"logout"} color={Color.lightbluegreen} size={20} style={styles.logouticon} />
        </TouchableOpacity>
      )
    }else{
      return(
        <View>
          {!isNullOrEmpty(item.title) ?
          <Text style={styles.sectionitemtt}>{intl.get('Settings.' + item.title)}</Text>
          : null }
          {
            item.list.map((listitem,index)=>{
              islast = (index == item.list.length - 1) ? true : false;
              return(
                <TouchableOpacity key={index} activeOpacity={0.9} onPress={()=> this._onSettingPress(listitem)}
                  style={[styles.sectionitemoption,islast ? {borderBottomWidth:0} : null,listitem.type == "toggle" ? {paddingRight:10}:null]}>
                  {listitem.name == "TransactionVerification" ?
                  <Text style={styles.sectionitemoptiontt}>{intl.get('Settings.' + listitem.name)} - <Text style={{color:Color.lightbluegreen}}>{intl.get('Settings.SelectedVerification',{total:this.props.settingStore.settings.security.selectedlist.length})}</Text></Text>
                  : 
                  <Text style={styles.sectionitemoptiontt}>{intl.get('Settings.' + listitem.name)}</Text>
                  }
                  {listitem.type == "arrow" || listitem.type == "content" ? 
                  <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
                  : null }
                  {listitem.type == "toggle" ? 
                  <Switch style={styles.togglebtn} trackColor={{false:"#9193A4",true:"#50c3c3"}} 
                  thumbColor={this.state.selectedtoggle.indexOf(listitem.key) > -1 ? Color.lightbluegreen : "#fff"}
                  value={this.state.selectedtoggle.indexOf(listitem.key) > -1 ? true : false} 
                  onValueChange={(value)=> this.onToggle(value,listitem.key)}/>
                  : null }
                  {listitem.name == "Currency" && listitem.type == "custom" ? 
                  <Text style={styles.whitetext}>{this.state.selectedcurrency}</Text>
                  : null }
                  {listitem.name == "Language" && listitem.type == "custom" ? 
                  <Text style={styles.whitetext}>{intl.get('Language.' + this.props.languageStore.language)}</Text>
                  : null }
                  {listitem.name == "ETHNetwork" && listitem.type == "custom" ? 
                  <View style={styles.networkdotctn}>
                    <View style={[styles.networkdot,{backgroundColor:this.state.selectedETHNetwork.color}]}></View>
                    <Text style={[styles.whitetext,{color:this.state.selectedETHNetwork.color}]}>{this.state.selectedETHNetwork.name}</Text>
                  </View>
                  : null }
                  {listitem.name == "WANNetwork" && listitem.type == "custom" ? 
                  <View style={styles.networkdotctn}>
                    <View style={[styles.networkdot,{backgroundColor:this.state.selectedWANNetwork.color}]}></View>
                    <Text style={[styles.whitetext,{color:this.state.selectedWANNetwork.color}]}>{this.state.selectedWANNetwork.name}</Text>
                  </View>
                  : null }
                </TouchableOpacity>
              )
            })
          }
        </View>
      )
    }
  }


  _showhideCurrencyPicker = ()=>{
    this.setState({
      showhidecurrencypicker:!this.state.showhidecurrencypicker
    })
  }
  
  _showhideNetworkPicker = (networktype)=>{
    this.setState({
      showhidenetworkpicker:!this.state.showhidenetworkpicker,
      showhidenetworktype:networktype
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

  _setBlockchainNetwork = (network,networktype) =>{
    this.setState({
      // oldnetwork:network,
      selectedETHNetwork:networktype == "ethnetwork" ? network : this.state.selectedETHNetwork,
      selectedWANNetwork:networktype == "wannetwork" ? network : this.state.selectedWANNetwork
    },()=>{
      this._showhideNetworkPicker("");
      this._updateStorageSetting(true);
    })
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

  render() {
    // console.log(this.props.settingStore.settings.pincode.code, this.props.settingStore.settings.pincode.enable)
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={intl.get('Settings.SETTINGS')} noback/>
          {this.state.refreshSetting ?
          <FlatList 
            data={settings_json}
            extraData={this.state}
            keyExtractor={(item,index)=>index.toString()}
            renderItem={this.renderItems.bind(this)}
            removeClippedSubviews
          />
          : null }
        </LinearGradient>
        <CurrencyPicker isVisible={this.state.showhidecurrencypicker} selectedCurrency={this.state.selectedcurrency} onBackdropPress={()=> this._showhideCurrencyPicker()}
        onBackButtonPress={()=> this._showhideCurrencyPicker()} onSelect={(currency)=> this._onSelectCurrency(currency)} />
        {/* <ReusedPicker title={intl.get('Settings.Pincode')} isVisible={this.state.showhidepincodemodal} onBackdropPress={()=> this._showhidePincodeModal()}
        onBackButtonPress={()=> this._showhidePincodeModal()} 
        content={
          <View>
            <Ripple style={styles.countrypickeritem} onPress={()=> this._changePincode()}>
              <Text style={styles.countrypickertt}>{intl.get('Settings.ChangePincode')}</Text>
            </Ripple>
            <Ripple style={styles.countrypickeritem} 
              onPress={this.props.settingStore.settings.pincode.enable ? ()=> this._disablePinDone() : ()=> this._enablePinDone()}
            >
              <Text style={styles.countrypickertt}>{`${this.props.settingStore.settings.pincode.enable ? intl.get('Common.Disable') : intl.get('Common.Enable')}`} {intl.get('Settings.Pincode')}</Text>
            </Ripple>
          </View>
        }/> */}
        <ReusedPicker title={intl.get('Settings.SelectNetwork.ethnetwork')} isVisible={this.state.showhidenetworkpicker && this.state.showhidenetworktype == "ETHNetwork"} onBackdropPress={()=> this._showhideNetworkPicker("ETHNetwork")}
        onBackButtonPress={()=> this._showhideNetworkPicker("ETHNetwork")}
        content={
          <View>
            {networkList.filter(x => x.type == "ethnetwork").map((item,index)=>{
              let islast = networkList.filter(x => x.type == "ethnetwork").length - 1 == index;
              return(
                <Ripple key={index} style={[styles.countrypickeritem,islast?{borderBottomColor:'transparent'}:null]} onPress={()=> this._setBlockchainNetwork(item,item.type)}>
                  <View style={styles.networkdotctn}>
                    <View style={[styles.networkdot,{backgroundColor:item.color}]}></View>
                    <Text style={[styles.countrypickertt,{color:item.color}]}>{item.name}</Text>
                  </View>
                  {this.state.selectedETHNetwork.shortcode == item.shortcode ?
                  <IoIcon name="md-checkmark" color="#fff" size={15} />
                  : null }
                </Ripple>
              )
            })}
          </View>
        } />
        <ReusedPicker title={intl.get('Settings.SelectNetwork.wannetwork')} isVisible={this.state.showhidenetworkpicker && this.state.showhidenetworktype == "WANNetwork"} onBackdropPress={()=> this._showhideNetworkPicker("WANNetwork")}
        onBackButtonPress={()=> this._showhideNetworkPicker("WANNetwork")}
        content={
          <View>
            {networkList.filter(x => x.type == "wannetwork").map((item,index)=>{
              let islast = networkList.filter(x => x.type == "wannetwork").length - 1 == index;
              return(
                <Ripple key={index} style={[styles.countrypickeritem,islast?{borderBottomColor:'transparent'}:null]} onPress={()=> this._setBlockchainNetwork(item,item.type)}>
                  <View style={styles.networkdotctn}>
                    <View style={[styles.networkdot,{backgroundColor:item.color}]}></View>
                    <Text style={[styles.countrypickertt,{color:item.color}]}>{item.name}</Text>
                  </View>
                  {this.state.selectedWANNetwork.shortcode == item.shortcode ?
                  <IoIcon name="md-checkmark" color="#fff" size={15} />
                  : null }
                </Ripple>
              )
            })}
          </View>
        } />
        <ReusedPicker title={intl.get('Settings.SelectLanguage')} isVisible={this.state.showhidelanguagepicker} onBackdropPress={()=> this._showhideLanguagePicker()}
        onBackButtonPress={()=> this._showhideLanguagePicker()}
        content={
          <View>
            {Object.keys(locales).map((lang,index)=>{
              return(
                <Ripple key={index} style={styles.countrypickeritem} onPress={()=> this._changeLanguage(lang)}>
                  <Text style={styles.countrypickertt}>{intl.get('Language.' + lang)}</Text>
                  {this.props.languageStore.language == lang ?
                  <IoIcon name="md-checkmark" color="#fff" size={15} />
                  : null }
                </Ripple>
              )
            })}
          </View>
        } />
      </SafeAreaView>
    );
  }
}

export default Settings;  

const styles = StyleSheet.create({
  pickerheadertt:{
    fontSize:14,
    color:"#fff",
    fontFamily:Config.boldtt
  },
  pickerheader:{
    paddingHorizontal:20,
    paddingVertical:15,
    backgroundColor:Color.greyblue
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
    color:"#fff",
    fontFamily:Config.regulartt
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
  sectionitemoptiontt:{
    color:Color.textgrey,
    fontFamily:Config.regulartt
  },
  sectionitemoption:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    borderBottomColor:"#3c4064",
    borderBottomWidth:1,
    flexDirection:"row",
    alignItems:'center',
    justifyContent:'space-between'
  },
  sectionitemtt:{
    color:"#fff",
    paddingVertical:20,
    paddingHorizontal:20,
    fontFamily:Config.boldtt
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
