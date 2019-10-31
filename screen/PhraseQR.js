import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Clipboard,
  Share
} from 'react-native';
import { QRCode } from 'react-native-custom-qr-codes';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import EnIcon from 'react-native-vector-icons/Entypo'
import AntIcon from 'react-native-vector-icons/AntDesign'
import * as Animatable from 'react-native-animatable';
import RiveIcon from '../extension/RiveIcon'

export default class PhraseQR extends Component {
  constructor(props){
    super(props);
    this.state = {
      didmount:false
    }
  }

  componentDidMount(){
    this.setState({
      didmount:true
    })
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={""} />
          <View style={styles.receivectn}>
              <Text style={styles.whitelabel}>QR Code</Text>
              <LinearGradient colors={['#4954AE', '#4A47A9', '#393B73']} style={styles.qrcontainer}>
                {/* {this.state.didmount ?
                <QRCode content='form food shed source science drip kiss employ admit thunder kite holiday' codeStyle='circle' size={220}
                  linearGradient={['#3D3D7D','#494FAC']} gradientDirection={[0,170,0,0]}/>
                : null } */}
                  <Text style={styles.addresskey}>This QR containts your Phrase</Text>
              </LinearGradient>
              <View style={styles.bottomnoticectn}>
                <RiveIcon name="gan-tan-hao" color={Color.lightbluegreen} size={17} />
                <Text style={[styles.greytt,{marginTop:3}]}>Never share mnemonic phrase with anyone, store it securely!</Text>
              </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  greytt:{
    color:Color.textgrey,
    textAlign:'center',
    width:'60%',
    alignSelf:'center',
    fontFamily:Config.regulartt
  },
  bottomnoticectn:{
    flexDirection:'row',
    alignSelf:'center',
    paddingVertical:20
  },
  receivectn:{
    justifyContent:'space-between',
    flexDirection:'column',
    // backgroundColor:'#ccc',
    flex:1
  },
  bottomnavinner:{
    alignItems:'center',
    justifyContent:'center'
  },
  whitelabel:{
    color:'#fff',
    marginTop:10,
    fontFamily:Config.regulartt
  },
  bottomnavbtn:{
    backgroundColor:'rgba(56,52,216,0.3)',
    height:50,
    width:50,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center'
  },
  bottomnavbtnctn:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingBottom:25,
    width:Config.winwidth * 0.6,
    alignSelf:'center'
  },
  addresskey:{
    color:Color.textgrey,
    fontSize:14,
    width:220,
    paddingTop:20,
    fontFamily:Config.regulartt,
    textAlign:'center'
  },
  qrcontainer:{
    padding:20,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:15,
    alignSelf:'center',
    marginTop:50
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
