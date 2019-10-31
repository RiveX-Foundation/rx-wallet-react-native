import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, BottomButton } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import AccountInfoContext from '../context/AccountInfoContext'
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import intl from 'react-intl-universal';

export default class Offline extends Component {
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          {/* <TopHeader {...this.props} title={"SETTINGS"} isclosebtn/> */}
          <View style={[styles.flexgrow,styles.centerlize]}>
            <Image source={require('../resources/offline.png')} style={styles.centerimg} />
            <Text style={styles.offlinett}>{intl.get('Offline.Yourecurrentlyoffline')}</Text>
            <Text style={styles.offlinett2}>{intl.get('Offline.Notice')}</Text>
          </View>
          <BottomButton title={intl.get('Common.Gotit')} onPress={()=> this.props.navigation.goBack()} />
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  offlinett2:{
    fontFamily:Config.regulartt,
    color:Color.textgrey,
    fontSize:14,
    marginHorizontal:20
  },
  offlinett:{
    fontFamily:Config.boldtt,
    color:'#fff',
    fontSize:18,
    marginBottom:5
  },
  centerlize:{
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  centerimg:{
    height:Config.winwidth * 0.8,
    width:Config.winwidth * 0.8,
    maxWidth:400,
    maxHeight:400,
    alignSelf:"center",
    marginTop:-50,
    marginBottom:40
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
