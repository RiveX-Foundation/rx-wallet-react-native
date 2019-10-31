import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Clipboard,
  Share,
  BackHandler
} from 'react-native';
// import { QRCode } from 'react-native-custom-qr-codes';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, NumberPad, BottomButton } from '../extension/AppComponents';
import { Color, Config, sendToast } from '../extension/AppInit';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import EnIcon from 'react-native-vector-icons/Entypo'
import AntIcon from 'react-native-vector-icons/AntDesign'
import * as Animatable from 'react-native-animatable';
import RiveIcon from '../extension/RiveIcon'
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import Ripple from 'react-native-material-ripple';
import AccountInfoContext from '../context/AccountInfoContext'
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@inject('settingStore')
@observer
class ExportKey extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedWallet:{}
    }
  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    this.setState({
      selectedWallet:params.selectedWallet
    });
  }

  componentWillUnmount(){
    const {params} = this.props.navigation.state;
    if(params.onBack){
      params.onBack();
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={""} />
          <Text style={styles.toptt}>{intl.get('ExportKey.Notice')}</Text>
          <LinearGradient colors={['#4954AE', '#4A47A9', '#393B73']} style={styles.qrcontainer}>
              <View style={styles.qrcodectn}>
                <QRCode value={"6194ac1a44f4cf8bc9c5657c4de50ef378a73261e94edd9807ccbe3dd16ef7e5"} size={180} color={"#4954AE"} />
              </View>
          </LinearGradient>
          <Text style={styles.privatekeyctn}> 
            {this.state.selectedWallet.privatekey}
          </Text>
          <View activeOpacity={0.9} style={styles.bottomnav}>
            <Ripple style={styles.bottomnavbtn}  onPress={()=> this.props.settingStore.copytoclipboard(this.state.selectedWallet.privatekey)}>
              <RiveIcon name="copy" color={"#fff"} size={22} />
            </Ripple>
            <Text style={styles.whitelabel}>{intl.get('Common.COPY')}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default ExportKey;

const styles = StyleSheet.create({
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
  bottomnav:{
    alignItems:'center',
    justifyContent:'center',
    marginTop:20
  },
  privatekeyctn:{
    backgroundColor:Color.rowblue,
    color:"#9193A4",
    fontFamily:Config.regulartt,
    padding:20,
    borderRadius:15,
    width:"90%",
    alignSelf:'center',
    marginTop:20
  },
  toptt:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:15,
    textAlign:'center',
    width:"70%",
    alignSelf:'center',
    marginVertical:20
  },
  qrcodectn:{
    backgroundColor:"#fff",
    padding:20
  },
  qrcontainer:{
    padding:20,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:15,
    alignSelf:'center',
    // marginTop:50
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
