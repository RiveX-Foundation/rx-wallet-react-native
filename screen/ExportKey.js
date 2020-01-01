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
  BackHandler,
  FlatList
} from 'react-native';
// import { QRCode } from 'react-native-custom-qr-codes';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, NumberPad, BottomButton } from '../extension/AppComponents';
import { Color, Config, sendToast, isObjEmpty } from '../extension/AppInit';
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
import FastImage from 'react-native-fast-image';
import IoIcon from 'react-native-vector-icons/Ionicons'

@inject('settingStore')
@observer
class ExportKey extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedWallet:{},
      currentindex:0,
      selectedToken:{}
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
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackExportKey);
    }
  }

  stepBackExportKey = () =>{
    this._stepGoBackExportKey();
    return true;
  }

  _stepGoBackExportKey = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.exportkeytab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
      if(currentindex == 0 && Platform.OS == "android"){
        BackHandler.removeEventListener('hardwareBackPress', this.stepBackExportKey);
      }
    }
    if(currentindex != 2){
      clearInterval(this.state.countdowntimer);
    }
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    },()=>{
      console.log(index)
    });
  }

  _renderItems({item,index}){
    return(
      <Ripple style={styles.rendereditem} onPress={()=> this._selectThisTokenToExport(item)}>
        <View style={styles.renderediteminner}>
          <FastImage source={{uri:item.LogoUrl}} style={styles.rendereditemicon} resizeMode={'contain'} />
          <Text style={styles.rendereditemtt}>{item.Name}</Text>
        </View>
        <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
      </Ripple>
    )
  }

  _selectThisTokenToExport = (item) =>{
    this.setState({
      selectedToken:item
    },()=>{
      this.exportkeytab.setPage(1);
      if(Platform.OS == "android"){
        BackHandler.addEventListener("hardwareBackPress", this.stepBackExportKey);
      }
    })
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} isclosebtn={this.state.currentindex == 0 ? true : false} 
          title={this.state.currentindex == 0 ? intl.get('ManageWallet.ExportPrivateKey.Picker') : ""} 
          backfunc={this.state.currentindex == 0 ? ()=> this.props.navigation.goBack() : ()=> this.exportkeytab.setPage(0)}/>
          <IndicatorViewPager ref={(r) => this.exportkeytab = r} style={styles.container} horizontalScroll={true} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.indicatorchild}>
              {!isObjEmpty(this.state.selectedWallet) ?
              <FlatList 
                data={this.state.selectedWallet.tokenassetlist}
                keyExtractor={(item,index) => index.toString()}
                renderItem={this._renderItems.bind(this)}
                contentContainerStyle={styles.mywalletlistctn}
              />
              : null }
            </View>
            <View style={styles.indicatorchild}>
              <Text style={styles.toptt}>{intl.get('ExportKey.Notice')}</Text>
              <LinearGradient colors={['#4954AE', '#4A47A9', '#393B73']} style={styles.qrcontainer}>
                  <View style={styles.qrcodectn}>
                    <QRCode value={this.state.selectedToken.PrivateAddress} size={180} color={"#4954AE"} />
                  </View>
              </LinearGradient>
              <Text style={styles.privatekeyctn}> 
                {this.state.selectedToken.PrivateAddress}
              </Text>
              <View activeOpacity={0.9} style={styles.bottomnav}>
                <Ripple style={styles.bottomnavbtn}  onPress={()=> this.props.settingStore.copytoclipboard(this.state.selectedToken.PrivateAddress)}>
                  <RiveIcon name="copy" color={"#fff"} size={22} />
                </Ripple>
                <Text style={styles.whitelabel}>{intl.get('Common.COPY')}</Text>
              </View>
            </View>
          </IndicatorViewPager>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default ExportKey;

const styles = StyleSheet.create({
  rendereditemicon:{
    height:37,
    width:37,
  },
  rendereditemtt:{
    fontFamily:Config.regulartt,
    fontSize:16,
    marginLeft:20,
    color:"#fff"
  },
  renderediteminner:{
    flexDirection:'row',
    alignItems:'center'
  },
  rendereditem:{
    backgroundColor:Color.rowblue,
    borderRadius:10,
    marginHorizontal:20,
    padding:18,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:20
  },
  indicatorchild:{
    flex:1
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
