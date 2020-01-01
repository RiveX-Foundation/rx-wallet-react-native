import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import AccountInfoContext from '../context/AccountInfoContext'
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import { WebView } from 'react-native-webview';

export default class WanDex extends Component {
  render() {
    return (
      <SafeAreaView style={styles.container}>
        {/* <StatusBar barStyle={"light-content"} backgroundColor={"#333"} /> */}
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <WebView source={{ uri: 'http://167.99.77.158:3000/' }} />
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08081E',
  }
});
