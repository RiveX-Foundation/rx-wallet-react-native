import React, { Component } from 'react';
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
  constructor(props) {
    super(props);
    this.state = {
      defaultURL: "https://wrdex.io/",
      loadURL: "https://wrdex.io/",
      loadedURL: ""
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {/* <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>

        </LinearGradient> */}
        <View style={Config.linearGradient}>
          <WebView source={{ uri: "https://exchange.wrdex.io/" }}
            ref={(r) => this.dexview = r}
            onLoad={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.log(nativeEvent.url);
              this.setState({
                loadedURL: nativeEvent.url
              })
            }} />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  webheader: {
    position: 'absolute',
    top: 40,
    zIndex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08081E',
  }
});
