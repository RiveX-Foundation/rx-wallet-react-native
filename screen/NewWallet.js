import React, {Component,useContext} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  Clipboard,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {TopHeader,TransBar,BottomButton} from '../extension/AppComponents'
import { Color, Config, shuffle, DevivationPath, sendToast, callApi } from '../extension/AppInit';
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import Ripple from 'react-native-material-ripple';
import {showMessage} from "react-native-flash-message";
import * as Animatable from 'react-native-animatable';
import AccountInfoContext from '../context/AccountInfoContext';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@inject('walletStore')
@inject('settingStore')
class NewWallet extends Component {
  constructor(props){
    super(props);
    this.state = {
     
    }
  }
  
  _navigateTo = (route,params) =>{
    this.props.navigation.replace(route,params);
  }
  
  render() {
    return (
      <SafeAreaView style={styles.container}>
          <TransBar />
          <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
            <TopHeader {...this.props} title={intl.get('Common.AddNewWallet').toUpperCase()} addNetwork isclosebtn />
            <Animatable.View animation={"slideInUp"} duration={200} useNativeDriver>
              <Ripple style={styles.newwalletitem} onPress={()=> this._navigateTo("BasicWallet",{})}>
                <View style={styles.newwalletiteminner}>
                  <RiveIcon name={"basic-wallet"} color={Color.basicColor} size={37} />
                  <Text style={[styles.newwalletitemtt,{color:Color.basicColor}]}>{intl.get('Common.BasicWallet')}</Text>
                </View>
                <IoIcon name="ios-arrow-forward" color={Color.basicColor} size={20} />
              </Ripple>
            </Animatable.View> 
            {/* <Animatable.View animation={"slideInUp"} duration={400} useNativeDriver>
              <Ripple style={styles.newwalletitem} onPress={()=> this._navigateTo("SharedWallet",{})}>
                <View style={styles.newwalletiteminner}>
                  <RiveIcon name={"shared-wallet"} color={Color.shareColor} size={37} />
                  <Text style={[styles.newwalletitemtt,{color:Color.shareColor}]}>{intl.get('Common.ShareWallet')}</Text>
                </View>
                <IoIcon name="ios-arrow-forward" color={Color.shareColor} size={20} />
              </Ripple>
            </Animatable.View> */}
            {/* <Animatable.View animation={"slideInUp"} duration={600} useNativeDriver>
              <Ripple style={[styles.newwalletitem]}>
                <View style={styles.newwalletiteminner}>
                  <RiveIcon name={"hardware-wallet"} color={Color.hardwareColor} size={37} />
                  <Text style={[styles.newwalletitemtt,{color:Color.hardwareColor}]}>Hardware Wallet</Text>
                </View>
                <IoIcon name="ios-arrow-forward" color={Color.hardwareColor} size={20} />
              </Ripple>
            </Animatable.View> */}
            <Animatable.View animation={"slideInUp"} duration={600} useNativeDriver>
              <Ripple style={styles.newwalletitem} onPress={()=> this._navigateTo("ImportWallet",{})}>
                <View style={styles.newwalletiteminner}>
                  <RiveIcon name={"import-wallet"} color={Color.importColor} size={37} />
                  <Text style={[styles.newwalletitemtt,{color:Color.importColor}]}>{intl.get('Common.ImportWallet')}</Text>
                </View>
                <IoIcon name="ios-arrow-forward" color={Color.importColor } size={20} />
              </Ripple>
            </Animatable.View>
          </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default NewWallet;  

const styles = StyleSheet.create({
  newwalletitemtt:{
    fontFamily:Config.regulartt,
    fontSize:16,
    marginLeft:20
  },
  newwalletiteminner:{
    flexDirection:'row',
    alignItems:'center'
  },
  newwalletitem:{
    backgroundColor:Color.rowblue,
    borderRadius:10,
    marginHorizontal:20,
    padding:18,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:20
  },
  container: {
    flex: 1
  }
});
