import {
  Clipboard,
  Share,
  BackHandler,
  Platform
} from 'react-native'
import { action, observable } from 'mobx';
import { Color, Config, shuffle, DevivationPath, sendToast, callApi } from '../extension/AppInit';
import ImagePicker from 'react-native-image-picker';
import {showMessage} from "react-native-flash-message";
import { withNavigation } from 'react-navigation';
import walletStore from '../stores/WalletStore'
import intl from 'react-intl-universal';
import { ethnetwork,wannetwork } from '../libs/network'

var QRCode = require('@remobile/react-native-qrcode-local-image');
const options_android = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};
const options_ios = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true, 
    path: 'images', 
    cameraRoll: true, 
    waitUntilSaved: true
  },
};

class SettingStore {
  @observable accinfo = {};
  @observable acctoken = "";
  @observable settings = {};
  @observable enableNotification = true;
  @observable isForeground = false;
  @observable disabledPinCode = false;
  @observable isShare = false;
  @observable networkType = "";
  @observable isNetworkConnected = false;
  @observable pincode = {
    code:"",
    enable:false
  }
  @observable selectedBlockchainNetwork = {}
  @observable selectedETHNetwork = {}
  @observable selectedWANNetwork = {}
  @observable selectedBlockchainNetwork = {}
  @observable convertrate = 1.34; // USD Price
  @observable openOffline = ()=> null;
  @observable newwalletObj = {
    walletname:"",
    userid : "",
    seedphase : "",
    privatekey : "",
    derivepath : "",
    publicaddress : "",
    addresstype : "",
    totalowners: 0,
    totalsignatures: 0,
    wallettype:"Basic",
    rvx_balance:0,
    network:"",
    ownerid:"",
    isOwner:false
  }

  @action setAccinfo(accinfo){
    this.accinfo = accinfo;
  }

  @action setAccToken(acctoken){
    this.acctoken = acctoken;
  }

  @action setSettings(settings){
    this.settings = settings;
  }

  @action setPincode(pincode){
    this.pincode = pincode;
  }

  @action setOffline = (func) =>{
    this.openOffline = func;
  }

  @action setNetworkInfo(type,connected){
    // console.log(type,connected);
    this.networkType = type;
    this.isNetworkConnected = connected;
    if(connected){
      // walletStore.resetHomeBeforeLoadWallet();
      walletStore.reloadWallet();
      walletStore.reloadSparkLine();
    }else{
      this.openOffline();
    }
  }

  @action setBlockchainNetwork(networkcode,networktype){
    // this.selectedBlockchainNetwork = network;
    if(networktype == "ethnetwork"){
      this.selectedETHNetwork = ethnetwork.find(x => x.shortcode == networkcode);
    }
    if(networktype == "wannetwork"){
      this.selectedWANNetwork = wannetwork.find(x => x.shortcode == networkcode);
    }
  }
  
  @action setEnableNotification(status){
    this.enableNotification = status;
  }

  @action setIsForeground(status){
    this.isForeground = status;
  }

  @action setdisabledPinCode(status){
    this.disabledPinCode = status;
  }

  @action setisShare(status){
    this.isShare = status;
  }

  @action pastetoclipboard = async(cb) =>{
    var content = await Clipboard.getString();
    cb(content);
  }

  @action copytoclipboard = (content) =>{
    console.log(content);
    Clipboard.setString(content);
    sendToast(intl.get('Common.AddressCopied'));
  }

  @action onShareContent = async (content) => {
    this.setdisabledPinCode(true);
    try {
      await Share.share({
        message:content
      }).then((result)=>{
          if (result.action === Share.sharedAction) {
            if (result.activityType) {
              // console.log("share 1")
              // shared with activity type of result.activityType
            } else {
              // console.log("share 2");
              this.setisShare(true);
              // shared
              // this.setdisabledPinCode(false);
            }
          } else if (result.action === Share.dismissedAction) {
            // console.log("share 3")
            // dismissed
          }
      })
    } catch (error) {
      console.log(error);
      //alert(error.message);
    }
  };

  @action PickQRToDecode = (type,cb) =>{
    this.setdisabledPinCode(true);
    setTimeout(() => {
      if(type == "photo"){
        ImagePicker.launchCamera(Platform.OS === 'android' ? options_android : options_ios, (response) => {
          if (!response.didCancel && !response.error && !response.customButton) {
            let decodepath = Platform.OS === 'android' ? response.path : response.uri.replace('file://','');
            QRCode.decode(decodepath, (error, result)=>{
              if(error == null){
                cb(result);
              }else{
                showMessage({
                  message: intl.get('Picker.QRImageNotValid'),
                  type: "warning",
                  icon:"warning"
                });
              }
            });
          }
        })
      }else{
        ImagePicker.launchImageLibrary(Platform.OS === 'android' ? options_android : options_ios, (response) => {
          if (!response.didCancel && !response.error && !response.customButton) {
            let decodepath = Platform.OS === 'android' ? response.path : response.uri.replace('file://','');
            console.log(decodepath)
            QRCode.decode(decodepath, (error, result)=>{
              if(error == null){
                cb(result);
              }else{
                showMessage({
                  message: intl.get('Picker.QRImageNotValid'),
                  type: "warning",
                  icon:"warning"
                });
              }
            });
          }
        });
      }
    }, 500);
  }

  @action goToScanner = (listener,navigation,cb) =>{
    BackHandler.removeEventListener('hardwareBackPress', listener);
    navigation.navigate("QRScanner",{onScanQR:(result) => cb(result,settingStore.setdisabledPinCode),onUnmount:()=>{
      BackHandler.addEventListener('hardwareBackPress', listener);
    }});
  }

  @action getUnixTime = (dateobj) =>{ 
    return dateobj.getTime()/1000|0 
  };

  @action Capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

const settingStore = new SettingStore();
export default settingStore;