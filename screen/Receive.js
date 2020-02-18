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
import { Color, Config, numberWithCommas, sendToast } from '../extension/AppInit';
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
class Receive extends Component {
  constructor(props){
    super(props);
    this.state = {
      startanimate:false,
      currentindex:0,
      setamount:"0",
      convertrate:43,
      selectedWallet:{},
      selectedToken:{},
    }
  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    this.setState({
      startanimate:true,
      selectedWallet:params.selectedWallet,
      selectedToken:params.selectedToken,
    });
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  onSetAmount = (value) =>{
    if(this.state.setamount.includes(".") && value == "."){
      return;
    }
    if(this.state.setamount.length == 1 && value == "0" && this.state.setamount == "0"){
      return;
    }
    if(this.state.setamount.length == 1 && value == "." && this.state.setamount == "0"){
      this.setState({
        setamount:"0."
      });
      return;
    }
    if(this.state.setamount.length == 1 && this.state.setamount == "0" && value != "0"){
      this.state.setamount = this.state.setamount.substring(0, this.state.setamount.length - 1);
    }
    this.setState({
      setamount:this.state.setamount + value
    },()=>{
      console.log(this.state.setamount);
    })
  }

  onRemoveAmount = () =>{
    this.setState({
      setamount:this.state.setamount.substring(0, this.state.setamount.length - 1)
    },()=>{
      if(this.state.setamount.length == 0){
        this.onSetAmount(0);
      }
      console.log(this.state.setamount);
    })
  }

  stepBackPress = () => {
    this._stepgoBack();
    return true;
  }

  _stepgoBack = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.receivetab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
    }
    BackHandler.removeEventListener('hardwareBackPress', this.stepBackPress);
    // console.log(currentindex);
  }

  _goToSetAmount = () =>{
    this.receivetab.setPage(1);
    BackHandler.addEventListener('hardwareBackPress', this.stepBackPress);
  }

  _goBackandRemove = () =>{
    BackHandler.removeEventListener('hardwareBackPress', this.stepBackPress);
    this.props.navigation.goBack();
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={this.state.currentindex == 0 ? intl.get('Common.Receive').toUpperCase() : intl.get('Common.SetAmount').toUpperCase()} backfunc={()=> this._stepgoBack()}
            isclosebtn={this.state.currentindex == 0 ? true : false}/>
          <IndicatorViewPager ref={(r) => this.receivetab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.receivectn}>
              <View style={[styles.centerlize,styles.flexgrow]}>
                <LinearGradient colors={['#4954AE', '#4A47A9', '#393B73']} style={styles.qrcontainer}>
                  {/* <QRCode content='ABCDEFG' codeStyle='circle' size={220}
                    linearGradient={['#3D3D7D','#494FAC']} gradientDirection={[0,170,0,0]}/> */}
                  <View style={styles.qrcodectn}>
                    <QRCode value={this.state.selectedToken.PublicAddress} size={180} color={"#4954AE"} />
                  </View>
                    <Text style={styles.addresskey}>{this.state.selectedToken.PublicAddress}</Text>
                </LinearGradient>
              </View>
              <View style={styles.bottomnavbtnctn}>
                <View style={styles.bottomnavinner}>
                  <Ripple style={styles.bottomnavbtn}  onPress={()=> this.props.settingStore.copytoclipboard(this.state.selectedToken.PublicAddress)}>
                    <RiveIcon name="copy" color={"#fff"} size={22} />
                  </Ripple>
                  <Text style={styles.whitelabel}>{intl.get('Common.COPY')}</Text>
                </View>
                {/* <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this._goToSetAmount()}>
                  <View style={styles.bottomnavbtn}>
                    <RiveIcon name="set-amount" color={"#fff"} size={28} />
                  </View>
                  <Text style={styles.whitelabel}>SET AMOUNT</Text>
                </Ripple> */}
                <View style={styles.bottomnavinner}>
                  <Ripple style={styles.bottomnavbtn}  onPress={()=> this.props.settingStore.onShareContent(this.state.selectedToken.PublicAddress)}>
                    <RiveIcon name="share" color={"#fff"} size={22} />
                  </Ripple>
                  <Text style={styles.whitelabel}>{intl.get('Common.SHARE')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.indicatorchild}>
              <View style={[styles.centerlize,styles.flexgrow]}>
                {/* <View style={styles.setamountctn}>
                  
                </View> */}
                <View style={styles.receiveamountctn}>
                  <Text style={styles.receiveamountcoin}>{`${this.state.setamount} RVX`}</Text>
                  <Text style={styles.receiveamountprice}>{`$${numberWithCommas(parseFloat(this.state.setamount) * this.state.convertrate,true)} ${this.props.settingStore.settings.currency}`}</Text>
                  <RiveIcon name="exchange" color={Color.lightbluegreen} size={20} style={styles.exchangebtn} />
                </View>
                <View style={[styles.receivenumpad,{marginTop:40}]}>
                  <NumberPad onEnter={(value)=> this.onSetAmount(value)} onRemove={()=> this.onRemoveAmount()} />
                </View>
              </View>
              <BottomButton title="Confirm" onPress={()=> this._goBackandRemove()} />
            </View>
          </IndicatorViewPager>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default Receive;

const styles = StyleSheet.create({
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  centerlize:{
    justifyContent:"center",
    alignContent:"center",
    alignItems:"center"
  },
  exchangebtn:{
    position:'absolute',
    right:20
  },
  receivenumpad:{
    alignSelf:'center',
    marginBottom:20
  },
  receiveamountprice:{
    color:Color.textgrey,
    fontSize:17,
    marginTop:10,
    fontFamily:Config.regulartt
  },
  receiveamountcoin:{
    color:'#fff',
    fontSize:30,
    fontFamily:Config.boldtt,
    marginTop:10
  },
  receiveamountctn:{
    backgroundColor:Color.rowblue,
    borderRadius:20,
    padding:25,
    width:Config.winwidth * 0.8,
    maxWidth:350,
    // alignSelf:'center'
    justifyContent:'center',
    alignItems:'center',
    marginTop:20
  },
  setamountctn:{
    flexGrow:1,
    flexShrink:1,
    // justifyContent:'space-between',
    alignItems:'center'
  },
  indicatorchild:{
    flex:1
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
    alignItems:'center',
    overflow:'hidden'
  },
  bottomnavbtnctn:{
    flexDirection:'row',
    alignItems:'center',
    // justifyContent:'space-between',
    justifyContent:'space-around',
    paddingBottom:25,
    width:Config.winwidth * 0.6,
    alignSelf:'center'
  },
  addresskey:{
    color:Color.textgrey,
    fontSize:14,
    width:220,
    paddingTop:20,
    fontFamily:Config.regulartt
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
