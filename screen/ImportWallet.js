import React, {Component} from 'react';
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
  BackHandler,
  TouchableOpacity,
  Clipboard
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {TopHeader,TransBar,BottomButton,QRImagePicker} from '../extension/AppComponents'
import { Color, Config, isNullOrEmpty } from '../extension/AppInit';
import { BaseButton,RectButton } from 'react-native-gesture-handler';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import RiveIcon from '../extension/RiveIcon'
import IoIcon from 'react-native-vector-icons/Ionicons'
import Ripple from 'react-native-material-ripple';
import AccountInfoContext from '../context/AccountInfoContext';
import { observer, inject } from 'mobx-react';
import ImagePicker from 'react-native-image-picker';
var QRCode = require('@remobile/react-native-qrcode-local-image');
import {showMessage} from "react-native-flash-message";
import intl from 'react-intl-universal';

const options = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

@inject('walletStore')
@inject('settingStore')
@observer
class ImportWallet extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentindex:0,
      currentpharseindex:0,
      recoveryseed:[],
      restorecontenttype:"key",
      restorecontent:[{
        type:"key",
        img:require("../resources/png7.png"),
        text:intl.get('ImportWallet.PrivateKey.Notice'),
        header:[intl.get('Common.ImportWallet').toUpperCase(),intl.get('Common.PrivateKey').toUpperCase(),intl.get('Common.PrivateKey').toUpperCase(),intl.get('Common.EnterPrivateKey').toUpperCase()],
        topmsg:intl.get('ImportWallet.PrivateKey.Msg')
      },{
        type:"phrase",
        img:require("../resources/png1.png"),
        text:intl.get('ImportWallet.MnemonicPhrase.Notice'),
        header:[intl.get('Common.ImportWallet').toUpperCase(),intl.get('Common.MnemonicPhrase').toUpperCase(),intl.get('Common.MnemonicPhrase').toUpperCase(),intl.get('Common.EnterMnemonicPhrase').toUpperCase()],
        topmsg:intl.get('ImportWallet.MnemonicPhrase.Msg')
      }],
      importfieldcontent:"",
      newwalletname:""
    }
  }

  componentDidMount(){
    // this._GetPrimaryTokenAssetByNetwork();
    this._presetBasicCompleteSave();
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackPressRestoreWallet);
    }
  }

  componentWillUnmount(){
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressRestoreWallet);
    }
  }

  // _GetPrimaryTokenAssetByNetwork = () =>{
  //   this.props.walletStore.GetPrimaryTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
  //     console.log("_GetPrimaryTokenAssetByNetwork", toJS(this.props.walletStore.primaryTokenAsset))
  //   },(response)=>{
  //     console.log(response)
  //   })
  // }

  stepBackPressRestoreWallet = () =>{
    this._stepGoBackRestoreWallet();
    return true;
  }

  _stepGoBackRestoreWallet = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      if(this.state.restorecontenttype == "phrase" && this.state.currentpharseindex > 0){
        this._onchangeSelectedPharseIndex(this.state.currentpharseindex - 1);
        this.phrasesteptab.setPage(this.state.currentpharseindex - 1);
      }else{
        currentindex--;
        this.restorewallettab.setPage(currentindex);
        let position = {position:currentindex};
        this._onchangeSelectedIndex(position);
      }
    }
    // console.log(currentindex)
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  _onchangeSelectedPharseIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentpharseindex:index
    });
  }

  renderSeedField(){
    var parents = [];
    for(var parent = 0; parent < 3; parent++){
      parents.push(
        <View key={parent} style={styles.parentrecoverctn}>
          {this.renderChildSeedField(parent)}
        </View>
      )
    }
    return parents;
  }

  renderChildSeedField(parent){
    var childs = [];
    for(var child = 1; child < 5; child++){
      childs.push(
        <View key={child} style={styles.recoverinputctn}>
          <Text style={styles.recovernums}>{child + (parent * 4)}.</Text>
          <TextInput style={styles.recoverinput} onChangeText={(text)=> this.setState({[`importphrase_${(child + (parent * 4))}`]:text})} />
        </View>
      )
    }
    return childs;
  }

  _setPhrase = (parent,child,text) =>{
    console.log(parent,child,text);
    // let newState = {};
    // newState[`importphrase_${index}`] = text;
    // this.setState(newState);
  }

  _goToScanner = () =>{
    this.props.settingStore.goToScanner(this.stepBackPressRestoreWallet,this.props.navigation,(result,disabled)=>{
      this.setState({
        importfieldcontent:result
      },()=>{
        disabled(false);
      });
    });
  }

  _onSelectImportType = (type) =>{
    this.setState({
      restorecontenttype:type
    },()=>{
      this.restorewallettab.setPage(1);
    });
  }

  _importWalletDone = () =>{
    this.props.walletStore.reloadWallet();
    this.props.navigation.goBack();
  }

  _onCompleteImport = () =>{
    this.props.walletStore.setSkipStore(false);
    if(this.state.restorecontenttype == "phrase"){
      if(this.state.importfieldcontent.split(" ").length != 12){
        showMessage({
          message: intl.get('Alert.InvalidLengthOfMnemonicePhrase'),
          type: "warning",
          icon:"warning"
        });
        return;
      }
      this.props.walletStore.createETHAddress(this.props.settingStore.accinfo.Id,this.state.newwalletname,this.state.importfieldcontent,0,0,"Basic",false);
    }else{
      this.props.walletStore.CreateETHAddressByPrivateKey(this.props.settingStore.accinfo.Id,this.state.newwalletname,this.state.importfieldcontent,0,0,"Basic",false);
    }
  }

  _presetBasicCompleteSave = () =>{
    this.props.walletStore.basicCompleteSave = () =>{
      this.restorewallettab.setPage(4);
    }
  }

  _checkName = () =>{
    if(isNullOrEmpty(this.state.newwalletname)){
      showMessage({
        message: intl.get('Alert.Walletnameisempty'),
        type: "warning",
        icon:"warning"
      });
      return;
    }
    this.restorewallettab.setPage(3);
  }

  render() {
    // const {params} = this.props.navigation.state;
    let selectedcontent = this.state.restorecontent.find((ele)=>{
      return ele.type == this.state.restorecontenttype;
    });
    return (
      <SafeAreaView style={styles.container}>
          <TransBar />
          <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
            {/* <TopHeader {...this.props} title={selectedcontent.header[this.state.currentindex]} noback={this.state.currentindex == 2} 
            backfunc={()=> this._stepGoBackRestoreWallet()} /> */}
            <TopHeader {...this.props} title={selectedcontent.header[this.state.currentindex]} isclosebtn={this.state.currentindex < 1}  noback={this.state.currentindex == 4} 
            backfunc={()=> this._stepGoBackRestoreWallet()} />
            <IndicatorViewPager ref={(r) => this.restorewallettab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
              {/* step 1 */}
              <View style={styles.indicatorchild}>
                <Ripple style={styles.menulistitem} onPress={()=> this._onSelectImportType('phrase')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"mnemonic-phrase"} color={"#fff"} size={37} />
                    <Text style={styles.menulistitemtt}>{intl.get('Common.MnemonicPhrase')}</Text>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple>
                <Ripple style={styles.menulistitem} onPress={()=> this._onSelectImportType('key')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"private-key"} color={"#fff"} size={37} />
                    <Text style={styles.menulistitemtt}>{intl.get('Common.PrivateKey')}</Text>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple>
              </View>
              {/* step 2 */}
              <View style={styles.indicatorchild}>
                <View style={[styles.flexgrow,styles.centerlize]}>
                  <Image source={selectedcontent.img} style={styles.centerimg2} resizeMode="contain" />
                  <Text style={[styles.headerwhite,{width:"60%",alignSelf:'center'}]}>{selectedcontent.text}</Text>
                </View>
                <BottomButton title={intl.get('Common.Continue')} onPress={()=> this.restorewallettab.setPage(2)} />
              </View>
              {/* step 3 */}
              <View style={styles.indicatorchild}>
                <ScrollView contentContainerStyle={[styles.centerlize,{height:Config.availableHeight}]} keyboardShouldPersistTaps={'always'}>
                  <Image source={require('../resources/png4.png')} style={styles.centerimg} resizeMode="contain" />
                  <Text style={styles.headerwhite}>{intl.get('BasicWallet.TypeYourWalletName')}</Text>
                  <KeyboardAvoidingView style={styles.namingctn}>
                    <TextInput style={styles.naminginput} onChangeText={(text)=> this.setState({newwalletname:text})} onSubmitEditing={()=> this._checkName()} />
                    <Ripple activeOpacity={0.9} style={styles.arrownextbtn} onPress={()=> this._checkName()}>
                      <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                    </Ripple>
                  </KeyboardAvoidingView>
                </ScrollView>
              </View>
              {/* step 4 */}
              {/* // <View style={styles.indicatorchild}>
                 <ScrollView contentContainerStyle={styles.recoverscrollctn}>
                   <Text style={[styles.greytt,{paddingVertical:15}]}>Type your 12-word mnemonic phrase to restore your existing wallet</Text>
                   <Text style={[styles.greytt,{paddingVertical:15}]}>
                   {`${(this.state.currentpharseindex * 4) + 1}-${(this.state.currentpharseindex * 4) + 4}`}
                   </Text>
                   <IndicatorViewPager ref={(r) => this.phrasesteptab = r} style={[styles.container]} onPageSelected={(response)=> this._onchangeSelectedPharseIndex(response)}>
                     {this.renderSeedField()}
                   </IndicatorViewPager>
                 </ScrollView>
                 <BottomButton title={"Next"} 
                 onPress={this.state.currentpharseindex == 0 ? ()=> this._mnemomicPhraseImport() : ()=> this.phrasesteptab.setPage(this.state.currentpharseindex + 1)} />
               </View> */}
              <View style={styles.indicatorchild}>
                <Text style={[styles.greytt,{paddingVertical:15}]}>{selectedcontent.topmsg}</Text>
                <View style={[styles.flexgrow,,{alignItems:'center'}]}>
                  <TextInput multiline={true} numberOfLines={5} style={styles.keyinput}
                  onChangeText={(text)=> this.setState({importfieldcontent:text})} value={this.state.importfieldcontent} />
                  <View style={[styles.bottomnavbtnctn,{marginTop:25}]}>
                    <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this.props.settingStore.pastetoclipboard((content)=>{
                      this.setState({importfieldcontent:content})
                    })}>
                      <View style={styles.bottomnavbtn}>
                        <RiveIcon name="paste" color={"#fff"} size={22} />
                      </View>
                      <Text style={styles.whitelabel}>{intl.get('Common.PASTE')}</Text>
                    </Ripple>
                    <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this.qrimagepicker.show()}>
                      <View style={styles.bottomnavbtn}>
                        <RiveIcon name="QR" color={"#fff"} size={22} />
                      </View>
                      <Text style={styles.whitelabel}>{intl.get('Common.IMAGE')}</Text>
                    </Ripple>
                    <Ripple activeOpacity={0.9} style={styles.bottomnavinner} onPress={()=> this._goToScanner()}>
                      <View style={styles.bottomnavbtn}>
                        <RiveIcon name="scan" color={"#fff"} size={22} />
                      </View>
                      <Text style={styles.whitelabel}>{intl.get('Common.SCAN')}</Text>
                    </Ripple>
                  </View>
                </View>
                <BottomButton title={intl.get('Common.Continue')} onPress={()=> this._onCompleteImport() }/>
              </View>
              {/* step 5 */}
              <View style={styles.indicatorchild}>
                <View style={[styles.flexgrow,styles.centerlize,{marginTop:-50}]}>
                  <Image source={require('../resources/png2.png')} style={styles.centerimg2} resizeMode="contain" />
                  <Text style={styles.finaltt}>{intl.get('Common.WalletRecovered')}</Text>
                  <Text style={[styles.headerwhite,{marginTop:10}]}>{intl.get('Common.WalletName')}</Text>
                  <Text style={[styles.greytt,{marginTop:10}]}>{this.state.newwalletname}</Text>
                </View>
                <BottomButton title={intl.get('Common.Confirm')} onPress={()=> this._importWalletDone()} />
              </View>
            </IndicatorViewPager>
          </LinearGradient>
          <QRImagePicker ref={(r) => this.qrimagepicker = r} onDecode={(result)=> this.setState({importfieldcontent:result})} {...this.props}/>
      </SafeAreaView>
    );
  }
}

export default ImportWallet;

const styles = StyleSheet.create({
  menulistitemtt:{
    fontFamily:Config.regulartt,
    fontSize:16,
    marginLeft:20,
    color:"#fff"
  },
  menulistiteminner:{
    flexDirection:'row',
    alignItems:'center'
  },
  menulistitem:{
    backgroundColor:Color.rowblue,
    borderRadius:10,
    marginHorizontal:20,
    padding:18,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:20
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
  keyinput:{
    backgroundColor:Color.rowblue,
    fontFamily:Config.regulartt,
    color:"#fff",
    paddingTop:20,
    paddingBottom:20,
    paddingLeft:20,
    paddingRight:20,
    borderRadius:20,
    marginTop:15,
    width:"80%",
    textAlignVertical:"top",
    height:150
  },
  centerlize:{
    justifyContent:"center",
    alignContent:"center",
    alignItems:'center'
  },
  recoverscrollctn:{
    height:Config.winheight - Config.statusBarHeight - 50 - 50
  },
  recoverinput:{
    // backgroundColor:'rgba(255,255,255,0.2)',
    width:'100%',
    paddingVertical:12,
    paddingHorizontal:10,
    color:'#fff',
    fontFamily:Config.regulartt
  },
  recovernums:{
    color:'#fff'
  },
  recoverinputctn:{
    width:'80%',
    maxWidth:400,
    backgroundColor:"#343860",
    borderRadius:100,
    paddingHorizontal:20,
    marginBottom:10,
    flexDirection:'row',
    alignItems:'center'
  },
  parentrecoverctn:{
    // justifyContent:'center',
    alignItems:'center'
  },
  finaltt:{
    color:Color.lightbluegreen,
    fontSize:35,
    fontWeight:'bold',
    alignSelf:'center',
    fontFamily:Config.regulartt
  },
  selectseedctn:{
    backgroundColor:"#2B2C61",
    padding:20,
    width:Config.winwidth - 40,
    borderRadius:15,
    paddingBottom:10
  },
  actionbtntt:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt
  },
  bottomseed:{
    flexDirection:'row',
    alignItems:'center',
    width:180,
    alignSelf:'center',
    justifyContent:'space-between'
  },
  recoveryseedctn:{
    flexDirection:'column',
    justifyContent:'space-between',
    alignItems:'center',
    width:'80%',
    flexWrap:'wrap',
    alignSelf:'center',
    marginTop:20,
    marginBottom:20,
    // backgroundColor:"#ccc"
  },
  seeditemtt:{
    color:"#fff",
    fontFamily:Config.regulartt
  },
  seeditem:{
    backgroundColor:"#333660",
    borderRadius:100,
    paddingVertical:5,
    paddingHorizontal:15,
    marginBottom:10,
    width:((Config.winwidth * 0.8) - 30) / 3,
    maxWidth:100,
    marginLeft:5,
    marginRight:5
  },
  bottomnoticectn:{
    flexDirection:'row',
    alignSelf:'center',
    paddingVertical:20
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  greytt:{
    color:Color.textgrey,
    textAlign:'center',
    width:'60%',
    alignSelf:'center',
    fontFamily:Config.regulartt
  },
  bullettt:{
    color:Color.textgrey,
    fontSize:15,
    marginLeft:10
  },
  bullet:{
    backgroundColor:Color.textgrey,
    height:7,
    width:7,
    borderRadius:100,
    marginTop:7
  },
  bulletitem:{
    flexDirection:"row",
    justifyContent:'flex-start',
    alignItems:'flex-start',
    alignContent:'flex-start',
    width:'80%',
    alignSelf:'center',
    textAlignVertical:'top',
    marginBottom:15
  },
  scrollbarctn:{
    paddingBottom:20
  },
  arrownextbtn:{
    backgroundColor:Color.deepblue,
    height:45,
    width:45,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:100
  },
  naminginput:{
    // backgroundColor:'#123',
    flex:1,
    paddingHorizontal:20,
    paddingVertical:10,
    color:'#fff'
  },
  namingctn:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:Color.greyblue,
    marginTop:20,
    borderRadius:100,
    width:300,
    alignSelf:'center',
  },
  headerwhite:{
    color:"#fff",
    textAlign:'center',
    // fontWeight:'bold'
    fontFamily:Config.regulartt
  },
  indicatorchild:{
    flex:1
  },
  aligncenter:{
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  desctt:{
    color:"#ccc",
    textAlign:'center',
    marginTop:10
  },
  circlebtntt:{
    color:"#fff",
  },
  circlebtn:{
    backgroundColor:Color.deepblue,
    width:150,
    alignSelf:'center',
    padding:20,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center'
  },
  centerimg:{
    height:Config.winwidth * 0.8,
    width:Config.winwidth * 0.8,
    maxWidth:400,
    maxHeight:400,
    alignSelf:"center",
    marginTop:-10,
    marginBottom:40
  },
  centerimg2:{
    height:Config.winwidth * 0.6,
    width:Config.winwidth * 0.6,
    maxWidth:350,
    maxHeight:350,
    alignSelf:"center",
    marginTop:-10,
    marginBottom:40
  },
  container: {
    flex: 1
  }
});
