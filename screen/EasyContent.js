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
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import AccountInfoContext from '../context/AccountInfoContext'
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import intl from 'react-intl-universal';

export default class EasyContent extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedContent:{},
    }
  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    this.setState({
      selectedContent:params.selectedContent
    });
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={this.state.selectedContent.name ? intl.get('Settings.' + this.state.selectedContent.name) : ""} isclosebtn/>
          <View style={styles.selectedcontentctn}>
            <Image source={require('../resources/fullnamelogo.png')} style={styles.logoimg} resizeMode={'contain'} />
            <Text style={styles.whitelabel}>{intl.get('Common.ComingSoon')}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  logoimg:{
    width:50,
    height:30
  },
  whitelabel:{
    color:'#fff',
    fontFamily:Config.regulartt,
    fontSize:18
  },
  selectedcontentctn:{
    flexGrow:1,
    flexShrink:1,
    justifyContent:'center',
    alignItems:'center'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
