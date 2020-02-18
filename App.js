import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  AppState,
  PermissionsAndroid,
  Alert
} from 'react-native';
import './shim.js'
import {AppContainer} from './extension/Route';
import Obscure from 'react-native-obscure';
let PrivacySnapshot = require('react-native-privacy-snapshot');
import {FlashAlert} from './extension/AppComponents';
// import Orientation from 'react-native-orientation-locker';
import AsyncStorage from '@react-native-community/async-storage';
import Pushy from 'pushy-react-native';
import walletStore from './stores/WalletStore';
import settingStore from './stores/SettingStore';
import languageStore from './stores/LanguageStore';
import securityStore from './stores/SecurityStore';
import {Provider} from 'mobx-react';
import NetInfo from "@react-native-community/netinfo";
import { Config } from './extension/AppInit';
import AndroidSplashScreen from 'react-native-splash-screen'
import iOSSplashScreen from 'react-native-smart-splash-screen'
import intl from 'react-intl-universal';
import locales from './locales';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';

const errorHandler = (e, isFatal) => {
  if (isFatal) {
    // Alert.alert(
    //     'Unexpected error occurred',
    //     `
    //     Error: ${(isFatal) ? 'Fatal:' : ''} ${e.name} ${e.message}
    //     We have reported this to our team ! Please close the app and start again!
    //     `,
    //   [{
    //     text: 'Close'
    //   }]
    // );
  //   Alert.alert(
  //     'Unexpected error occurred',
  //     `
  //     We have reported this to our team ! Please close the app and start again!
  //     `,
  //   [{
  //     text: 'Close'
  //   }]
  // );
  // console.log(`Error: ${(isFatal) ? 'Fatal:' : ''} ${e.name} ${e.message}`)
  } else {
    console.log(e); // So that we can see it in the ADB logs in case of Android if needed
  }
};

// Subscribe
NetInfo.addEventListener(state => {
  // console.log("Connection type", state.type);
  // console.log("Is connected?", state.isConnected);
  settingStore.setNetworkInfo(state.type,state.isConnected);
});

setJSExceptionHandler(errorHandler, true);

setNativeExceptionHandler(errorHandler, true);

try{
  Pushy.setNotificationListener(async (data) => {
    const accinfo_value = await AsyncStorage.getItem('@accinfo');
    if(accinfo_value != null){
      let parseaccountinfo = JSON.parse(accinfo_value);
      const settings_value = await AsyncStorage.getItem('@settings');
      if(settings_value != null){
        let parsesettings = JSON.parse(settings_value);
        let selectedsetting = parsesettings.find(x => x.Id == parseaccountinfo.user.Id);
        // Print notification payload data
        // console.log('Received notification: ' + JSON.stringify(data));
        // console.log("selectedsetting.notification", selectedsetting.notification)
        // Notification title
        let notificationTitle = 'RiveX';
    
        // Attempt to extract the "message" property from the payload: {"message":"Hello World!"}
        let notificationText = data.message || 'Test notification';
        if(selectedsetting.notification){
          // Display basic system notification
          Pushy.notify(notificationTitle, notificationText);
        }
      }
    }
  });
}catch(e){

}

export default class App extends Component {
  //remember to config in xcode
  componentWillMount() {
    this._changeLanguage("en_US");
    if(Config.enabledPrivacy){
      Platform.OS === "android" ? Obscure.activateObscure() : PrivacySnapshot.enabled(true);
    }
    // this.clearAll(); 
  }

  componentDidMount(){
    if(Platform.OS === 'android'){
      AndroidSplashScreen.hide()
    }else{
      iOSSplashScreen.close({
        animationType: iOSSplashScreen.animationType.fade,
        duration: 850,
        delay: 500,
      })
    }
    try{
      Pushy.listen();
      Pushy.setNotificationIcon('ic_notification');
      this._registerPushy();
      // this._subcribePushy();
    }catch(e){

    }
    // Platform.OS === "android" ? Orientation.lockToPortrait() : null;
    this._grandPermission();
  }

  componentWillUnmount() {
    Platform.OS === "android" ? Obscure.deactivateObscure() : PrivacySnapshot.enabled(false);
  }

  _grandPermission = () =>{
    // Only necessary for Android
    if (Platform.OS === 'android') {
      // Check whether the user has granted the app the WRITE_EXTERNAL_STORAGE permission
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then((granted) => {
          if (!granted) {
              // Request the WRITE_EXTERNAL_STORAGE permission so that the Pushy SDK will be able to persist the device token in the external storage
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then((result) => {
                  // User denied permission?
                  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                      // Possibly ask the user to grant the permission
                  }
              });
          }
      });
    }
  }

  _changeLanguage = (lan) => {
    // console.log("_changeLanguage", lan)
    intl.init({
      currentLocale: lan,
      locales
    }).then(() => {
      languageStore.setLanguage(lan);
    });
  }

  _registerPushy = (firsttime) =>{
    // Register the device for push notifications
    Pushy.register().then(async (deviceToken) => {
      // Display an alert with device token
      console.log('Pushy device token: ' + deviceToken);
      if(firsttime){
        // this._subcribePushy();
      }
      // Send the token to your backend server via an HTTP GET request
      //await fetch('https://your.api.hostname/register/device?token=' + deviceToken);

      // Succeeded, optionally do something to alert the user
    }).catch((err) => {
      // Handle registration errors
      console.error(err);
    })
  }

  // _subcribePushy = () =>{
  //   // Make sure the device is registered
  //   Pushy.isRegistered().then((isRegistered) => {
  //     if (isRegistered) {
  //       // Subscribe the device to a topic
  //       Pushy.subscribe('mokmoktest').then(() => {
  //         // Subscribe successful
  //         console.log('Subscribed to topic successfully');
  //       }).catch((err) => {
  //         // Handle errors
  //         console.error(err);
  //       });
  //     }else{
  //       console.log("not yet register");
  //       this._registerPushy(true);
  //     }
  //   });
  // }

  clearAll = async () => {
    try {
      await AsyncStorage.clear();
      // await AsyncStorage.removeItem("@settings")
      // await AsyncStorage.removeItem("@pincode")
    } catch(e) {
      // clear error
    }
  
    console.log('Done.')
  }

  render() {
    return (
      <Provider walletStore={walletStore} settingStore={settingStore} 
      languageStore={languageStore} securityStore={securityStore}>
        <View style={{flex:1}} >
          <AppContainer  />
          <FlashAlert />
          {/* {!settingStore.isNetworkConnected ?
          <Text style={styles.offline}>You are offline</Text>
          : null } */}
        </View>
      </Provider>
    );
  }
}


// const styles = StyleSheet.create({
//   offline:{
//     fontFamily:Config.regulartt,
//     fontSize:14,
//     color:'#fff',
//     backgroundColor:'rgba(0,0,0,0.7)',
//     position:'absolute',
//     left:0,
//     right:0,
//     bottom:0,
//     padding:15,
//     textAlign:'center'
//   }
// })