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
import {TopHeader,TransBar,BottomButton,QRImagePicker,ScreenLoader} from '../extension/AppComponents'
import { Color, Config, shuffle, DevivationPath, sendToast, callApi, isNullOrEmpty } from '../extension/AppInit';
import { BaseButton,RectButton } from 'react-native-gesture-handler';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import bip39 from 'react-native-bip39'
import Ripple from 'react-native-material-ripple';
import {showMessage} from "react-native-flash-message";
import AsyncStorage from '@react-native-community/async-storage';
import HDKey from 'hdkey';
const ethUtil = require('ethereumjs-util');
import AccountInfoContext from '../context/AccountInfoContext';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import Menu, { MenuItem } from 'react-native-material-menu';
import QRCodeComponent from 'react-native-qrcode-svg';
const Web3 = require('web3');

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
class SharedWallet extends Component {
  constructor(props){
    super(props);
    this.state = {
      newwalletname:"",
      currentindex:0,
      seedval:"",
      sharewallettype:"create",
      sharewalletcontent:[{
        type:"create",
        header:[intl.get('ShareWallet.CreateSharedWallet').toUpperCase(),intl.get('ShareWallet.CreateSharedWallet').toUpperCase(),intl.get('ShareWallet.WALLETINVITATION')]
      },{
        type:"join",
        header:[intl.get('ShareWallet.WALLETINVITATION'),intl.get('ShareWallet.JoinSharedWallet').toUpperCase()]
      }],
      totalowners:2,
      totalsignatures:2,
      importfieldcontent:"",
      finaltotalowners:2,
      finaltotalsignatures:2,
      createdsharedwallet:{}
    }
  }

  componentDidMount(){
    this._presetBasicCompleteSave();
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackPressSharedWallet);
    }
  }

  componentWillUnmount(){
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackPressSharedWallet);
    }
  }

  generate12SeedPhase = async() => {
    this.props.walletStore.generate12SeedPhase((mnemonic)=>{
      console.log(mnemonic);
      this.setState({
        seedval:mnemonic
      })
    });
  }

  stepBackPressSharedWallet = () =>{
    this._stepGoBackSharedWallet();
    return true;
  }

  _stepGoBackSharedWallet = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.sharewallettab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
    }
    // console.log(currentindex)
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  _createWalletDone = () =>{
    this.props.walletStore.reloadWallet();
    this.props.navigation.goBack();
  }

  _onSelectCreateType = (type) =>{
    this.setState({
      sharewallettype:type
    },()=>{
      if(type == "create"){
        this.generate12SeedPhase();
      }
      this.sharewallettab.setPage(1);
    });
  }

  _showhideDropDownMenu = (isShow,type,val) =>{
    // console.log(isShow,type,val)
    if(type == "copayer"){
      if(isShow){
        this.dropdowncopayer.show();
      }else{
        this.setState({
          totalowners:val,
          finaltotalowners:val,
          totalsignatures:val,
          finaltotalsignatures:val
        },()=>{
          this.dropdowncopayer.hide();
        });
      }
    }else{
      if(isShow){
        this.dropdownsig.show();
      }else{
        this.setState({
          totalsignatures:val,
          finaltotalsignatures:val
        },()=>{
          this.dropdownsig.hide();
        });
      }
    }
  }

  _createShareWallet = () =>{
    if(this.state.sharewallettype == "create"){
      if(isNullOrEmpty(this.state.newwalletname)){
        showMessage({
          message: intl.get('Alert.Walletnameisempty'),
          type: "warning",
          icon:"warning"
        });
        return;
      }
      if(this.state.totalsignatures > this.state.totalowners || this.state.totalsignatures == 0 || this.state.totalowners == 0){
        showMessage({
          message: intl.get('Alert.InvalidRequest'),
          type: "warning",
          icon:"warning",
        });
        return;
      }
      this.screenloader.show();
      this.props.walletStore.setSkipStore(true);
      // console.log(this.props.settingStore.accinfo.Id);
      this.props.walletStore.createETHAddress(this.props.settingStore.accinfo.Id,this.state.newwalletname,this.state.seedval,this.state.totalowners,this.state.totalsignatures,"Shared",true);
    }else{ // join
      this._createJoinMultiSigWallet();
    }
  }

  _presetBasicCompleteSave = () =>{
    this.props.walletStore.basicCompleteSave = (wallet) =>{
      this.props.walletStore.createMultiSigWallet(this.props.settingStore.acctoken,wallet,(response)=>{
        this.screenloader.hide();
        // console.log("_presetBasicCompleteSave", response);
        if(response.status == 200){
          this.props.walletStore.saveETHWalletToStorage(wallet,()=>{
            // console.log("save this" , wallet);
            this.setState({
              createdsharedwallet:wallet
            },()=>{
              this.props.walletStore.resetHomeBeforeLoadWallet();
              this.props.walletStore.reloadWallet();
              this.sharewallettab.setPage(2);
              // this.props.navigation.replace("WalletInvitation",{selectedWallet:wallet});
            })
          })
        }else{
          showMessage({
            message: intl.get('Error.' + response.msg), //"Something went wrong, Try again later."
            type: "danger",
            icon:"danger",
          });
        }
      },(response)=>{
        // console.log(response)
        this.screenloader.hide();
        showMessage({
          message: intl.get('Error.Unknow'),
          type: "danger",
          icon:"danger",
        });
      });
    }
  }

  _createJoinMultiSigWallet = () =>{
    if(isNullOrEmpty(this.state.importfieldcontent) || !Web3.utils.isAddress(this.state.importfieldcontent)){
      showMessage({
        message: intl.get('Alert.InvalidRequest'),
        type: "warning",
        icon:"warning",
        // autoHide:false
      });
      return;
    }
    this.screenloader.show();
    this.props.walletStore.joinMultiSigWallet(this.props.settingStore.accinfo.Id,this.props.settingStore.acctoken,this.state.importfieldcontent,(wallet)=>{
      this.screenloader.hide();
      if(!wallet.status){
        this.setState({
          finaltotalowners:wallet.NumbersOfOwners,
          finaltotalsignatures:wallet.NumbersOfSigners
        },()=>{
          this.sharewallettab.setPage(2);
        })
      }
    },(response)=>{
      console.log(response)
      this.screenloader.hide();
      showMessage({
        message: intl.get('Error.' + response.msg),//this._checkJoinMultiSigReturn(response.msg),
        type: "warning",
        icon:"warning",
        // autoHide:false
      });
    });
  }

  // _checkJoinMultiSigReturn(msg){
  //   let returnmsg = intl.get('Alert.InvalidRequest');
  //   switch(msg){
  //     case "sameuserhadbeenadded":
  //       returnmsg = "Same user had been added";
  //     break;
  //     case "seatisfull":
  //       returnmsg = "Seat is full";
  //     break;
  //     case "walletnotfound":
  //       returnmsg = "Wallet not found";
  //     break;
  //   }
  //   return returnmsg;
  // }

  _goToScanner = () =>{
    this.props.settingStore.goToScanner(this.stepBackPressSharedWallet,this.props.navigation,(result,disabled)=>{
      this.setState({
        importfieldcontent:result
      },()=>{
        disabled(false);
      });
    });
  }

  _renderSelectNumber = (type) =>{
    let menuitemlist = [];
    for(let index = 2; index <= (type == "copayer" ? 6 : this.state.finaltotalowners); index++){
      menuitemlist.push(
        <MenuItem key={index} onPress={()=> this._showhideDropDownMenu(false,type,index)} 
        style={[styles.dropdownmenuitem,
          (type == "copayer" ? this.state.totalowners : this.state.totalsignatures) == index ? {backgroundColor:"#3741A6"} : null]
        } 
        children={
          <Text style={styles.dropdownmenuitemtt}>{index}</Text>
        } />
      )
    }
    return menuitemlist;
  }

  _goBackRefresh = () =>{
    this.props.walletStore.reloadWallet();
    this.props.navigation.goBack();
  }

  // this.state.currentindex == 0 ||  
  render() {
    const {params} = this.props.navigation.state;
    let selectedcontent = this.state.sharewalletcontent.find((ele)=>{
      return ele.type == this.state.sharewallettype;
    });
    return (
      <SafeAreaView style={styles.container}>
          <TransBar />
          <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
            <TopHeader {...this.props} title={selectedcontent.header[this.state.currentindex]} 
            isclosebtn={this.state.currentindex == 0 ? true : false} noback={this.state.currentindex == (this.state.sharewallettype == "create" ? 3 : 2)  ? true : false} 
            backfunc={()=> this._stepGoBackSharedWallet()} /> 
            <IndicatorViewPager ref={(r) => this.sharewallettab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
              {/* step 1 */}
              <View style={styles.indicatorchild}>
                <Ripple style={styles.menulistitem} onPress={()=> this._onSelectCreateType('create')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"create-shared-wallet"} color={"#fff"} size={37} />
                    <Text style={styles.menulistitemtt}>{intl.get('ShareWallet.CreateSharedWallet')}</Text>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple>
                <Ripple style={styles.menulistitem} onPress={()=> this._onSelectCreateType('join')}>
                  <View style={styles.menulistiteminner}>
                    <RiveIcon name={"create-shared"} color={"#fff"} size={37} />
                    <Text style={styles.menulistitemtt}>{intl.get('ShareWallet.JoinSharedWallet')}</Text>
                  </View>
                  <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
                </Ripple>
              </View>
              {/* step 2 */}
              {this.state.sharewallettype  == "create" ?
              <View style={styles.indicatorchild}>
                <ScrollView keyboardShouldPersistTaps={'always'} contentContainerStyle={{paddingBottom:20}}>
                  <View style={styles.inputfieldctn}>
                    <Text style={styles.inputfieldtt}>{intl.get('Common.WalletName')}</Text>
                    <TextInput style={styles.inputfield} onChangeText={(text)=> this.setState({newwalletname:text})} 
                    onSubmitEditing={()=> this._createShareWallet()}/>
                  </View>
                  <View style={styles.inputfieldctn}>
                    <Text style={styles.inputfieldtt}>{intl.get('ShareWallet.Totalnumbersofcopayers')}</Text>
                    <Menu
                      ref={(r) => this.dropdowncopayer = r}
                      button={
                        <TouchableOpacity activeOpacity={1} onPress={()=> this._showhideDropDownMenu(true,"copayer","")} style={styles.dropdownmenuitemctn}>
                          <Text style={styles.dropdownmenuitemtt}>{this.state.totalowners}</Text>
                          <IoIcon name={"ios-arrow-down"} color={"#fff"} size={18} style={{marginLeft:10}} />
                        </TouchableOpacity>
                      }
                      style={styles.mainmenuctn}
                    >
                      <ScrollView keyboardShouldPersistTaps={'always'}>
                        {this._renderSelectNumber("copayer")}
                        {/* {["","","","","",""].map((val,index)=>{
                          return(
                            <MenuItem key={index} onPress={()=> this._showhideDropDownMenu(false,"copayer",index)} 
                            style={[styles.dropdownmenuitem,this.state.totalowners == index ? {backgroundColor:"#3741A6"} : null]} 
                            children={
                              <Text style={styles.dropdownmenuitemtt}>{index}</Text>
                            } />
                          )
                        })} */}
                      </ScrollView>
                    </Menu>
                  </View>
                  <View style={styles.inputfieldctn}>
                    <Text style={styles.inputfieldtt}>{intl.get('ShareWallet.Requirednumberofsignatures')}</Text>
                    <Menu
                      ref={(r) => this.dropdownsig = r}
                      button={
                        <TouchableOpacity activeOpacity={1} onPress={()=> this._showhideDropDownMenu(true,"sig","")} style={styles.dropdownmenuitemctn}>
                          <Text style={styles.dropdownmenuitemtt}>{this.state.totalsignatures}</Text>
                          <IoIcon name={"ios-arrow-down"} color={"#fff"} size={18} style={{marginLeft:10}} />
                        </TouchableOpacity>
                      }
                      style={styles.mainmenuctn}
                    >
                      <ScrollView keyboardShouldPersistTaps={'always'}>
                        {this._renderSelectNumber("sig")}
                        {/* {["","","","","",""].map((val,index)=>{
                          return(
                            <MenuItem key={index} onPress={()=> this._showhideDropDownMenu(false,"sig",index)} 
                            style={[styles.dropdownmenuitem,this.state.totalsignatures == index? {backgroundColor:"#3741A6"} : null]} 
                            children={
                              <Text style={styles.dropdownmenuitemtt}>{index}</Text>
                            } />
                          )
                        })} */}
                      </ScrollView>
                    </Menu>
                  </View>
                </ScrollView>
                <BottomButton title={intl.get('Common.Create')} onPress={()=> this._createShareWallet()}/>
              </View>
              : 
              <View style={styles.indicatorchild}>
                <Text style={[styles.greytt,{paddingVertical:15}]}>{intl.get('ShareWallet.PasteWalletInvitationHere')}</Text>
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
                <BottomButton title={intl.get('Common.Next')} onPress={()=> this._createShareWallet()}/>
              </View>
              }
              {this.state.sharewallettype  == "create" ?
              <View style={styles.indicatorchild}>
                <View style={styles.flexgrow}>
                  <Text style={[styles.whitelabel,{alignSelf:'center',marginTop:30,marginBottom:20}]}>{intl.get('ShareWallet.WalletInvitation.Msg')}</Text>
                  <LinearGradient colors={['#4954AE', '#4A47A9', '#393B73']} style={styles.qrcontainer}>
                    <View style={styles.qrcodectn}>
                      <QRCodeComponent value={this.state.createdsharedwallet.publicaddress} size={100} color={"#4954AE"} />
                    </View>
                  </LinearGradient>
                  <View style={styles.inputfieldctn2}>
                    <Text style={styles.inputfield2} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.createdsharedwallet.publicaddress}</Text>
                    <TouchableOpacity activeOpacity={1} onPress={()=> this.props.settingStore.copytoclipboard(this.state.createdsharedwallet.publicaddress)}>
                      <RiveIcon name="copy" color={"#fff"} size={22} />
                    </TouchableOpacity>
                  </View>
                </View>
                <BottomButton title={intl.get('Common.Next')} onPress={()=> this.sharewallettab.setPage(3)}/>
              </View>
              : 
              <View style={styles.indicatorchild}>
                <View style={[styles.flexgrow,styles.centerlize,{marginTop:-50}]}>
                  <Image source={require('../resources/png2.png')} style={styles.centerimg2} resizeMode="contain" />
                  <Text style={styles.finaltt}>{`${this.state.sharewallettype == "create" ? intl.get('Common.Created') : intl.get('Common.Joined')} ${this.state.finaltotalsignatures}-${this.state.finaltotalowners} ${intl.get('Common.ShareWallet')}`}</Text>
                  <Text style={[styles.headerwhite,{marginTop:10}]}>{intl.get('Common.WalletName')}</Text>
                  <Text style={[styles.greytt,{marginTop:10}]}>{this.state.newwalletname}</Text>
                </View>
                <BottomButton title={intl.get('Common.Confirm')} onPress ={()=> this._goBackRefresh()}/>
              </View>
             }
              {/* last step */}
              <View style={styles.indicatorchild}>
                <View style={[styles.flexgrow,styles.centerlize,{marginTop:-50}]}>
                  <Image source={require('../resources/png2.png')} style={styles.centerimg2} resizeMode="contain" />
                  <Text style={styles.finaltt}>{`${this.state.sharewallettype == "create" ? intl.get('Common.Created') : intl.get('Common.Joined')} ${this.state.finaltotalsignatures}-${this.state.finaltotalowners} ${intl.get('Common.ShareWallet')}`}</Text>
                  <Text style={[styles.headerwhite,{marginTop:10}]}>{intl.get('Common.WalletName')}</Text>
                  <Text style={[styles.greytt,{marginTop:10}]}>{this.state.newwalletname}</Text>
                </View>
                <BottomButton title={intl.get('Common.Confirm')} onPress ={()=> this._goBackRefresh()}/>
              </View>
            </IndicatorViewPager>
          </LinearGradient>
          <QRImagePicker ref={(r) => this.qrimagepicker = r} onDecode={(result)=> this.setState({importfieldcontent:result})} {...this.props}/>
          <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default SharedWallet;  

const styles = StyleSheet.create({
  inputfieldctn2:{
    marginHorizontal:20,
    marginTop:20,
    // width:'100%',
    maxWidth:400,
    backgroundColor:Color.rowblue,
    borderRadius:10,
    paddingHorizontal:20,
    marginBottom:10,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    minHeight:55,
  },
  inputfield2:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14,
    width:'80%'
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
    padding:12
  },
  qrcontainer:{
    padding:12,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:15,
    alignSelf:'center',
    // marginTop:50
  },
  whitelabel:{
    color:'#fff',
    marginTop:10,
    fontFamily:Config.regulartt
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  bottomnavbtnctn:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingBottom:25,
    width:Config.winwidth * 0.6,
    alignSelf:'center'
  },
  bottomnavbtn:{
    backgroundColor:'rgba(56,52,216,0.3)',
    height:50,
    width:50,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center'
  },
  bottomnavinner:{
    alignItems:'center',
    justifyContent:'center'
  },
  greytt:{
    color:Color.textgrey,
    textAlign:'center',
    width:'60%',
    alignSelf:'center',
    fontFamily:Config.regulartt
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
  mainmenuctn:{
    borderRadius:7,
    overflow:'hidden',
    backgroundColor:'#343761',
    maxHeight:200
  },
  dropdownmenuitem:{
    // width:150
  },
  dropdownmenuitemctn:{
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    paddingHorizontal:20,
    overflow:'hidden',
    backgroundColor:Color.rowblue,
    alignSelf:'flex-start',
    minHeight:50,
    borderRadius:10,
    minWidth:100
  },
  dropdownmenuitemtt:{
    fontFamily:Config.regulartt,
    color:"#fff",
    fontSize:16
  },
  inputfieldtt:{
    fontFamily:Config.regulartt,
    fontSize:14,
    color:"#fff",
    marginBottom:10
  },
  inputfield:{
    width:'100%',
    maxWidth:400,
    backgroundColor:Color.rowblue,
    borderRadius:10,
    paddingHorizontal:20,
    marginBottom:10,
    flexDirection:'row',
    alignItems:'center',
    minHeight:55,
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  inputfieldctn:{
    marginHorizontal:20,
    marginTop:20
  },
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
  centerlize:{
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  // recoveryseedbeforectn:{
  //   alignItems:'center',
  //   minHeight:150
  // },
  // recoveryseedbeforectnmain:{
  //   width:Config.winwidth - 40,
  //   alignSelf:'center',
  //   marginTop:40,
  // },
  finaltt:{
    color:Color.lightbluegreen,
    fontSize:28,
    fontFamily:Config.boldtt,
    // fontWeight:'bold',
    alignSelf:'center'
  },
  // selectseedinner:{
  //   alignItems:'center',
  //   minHeight:150
  // },
  // selectseedctn:{
  //   backgroundColor:"#2B2C61",
  //   padding:20,
  //   width:Config.winwidth - 40,
  //   borderRadius:15,
  //   paddingBottom:10,
  //   alignSelf:'center',
  //   marginTop:20,
  //   // marginBottom:40
  // },
  // actionbtntt:{
  //   color:Color.lightbluegreen,
  //   fontFamily:Config.regulartt
  // },
  // bottomseed:{
  //   flexDirection:'row',
  //   alignItems:'center',
  //   width:180,
  //   alignSelf:'center',
  //   // justifyContent:'space-between'
  //   justifyContent:'center'
  // },
  // recoveryseedctn:{
  //   // flexDirection:'column',
  //   // justifyContent:'space-between',
  //   alignItems:'center',
  //   // width:'80%',
  //   // flexWrap:'wrap',
  //   alignSelf:'center',
  //   marginTop:20,
  //   marginBottom:20,
  //   // backgroundColor:"#ccc"
  // },
  // seeditemtt:{
  //   color:"#fff",
  //   fontFamily:Config.regulartt
  // },
  // seeditem:{
  //   backgroundColor:"#343860",
  //   borderRadius:100,
  //   paddingVertical:5,
  //   paddingHorizontal:10,
  //   marginBottom:12,
  //   width:95,
  //   maxWidth:110,
  //   marginLeft:5,
  //   marginRight:5
  // },
  // bottomnoticectn:{
  //   flexDirection:'row',
  //   alignSelf:'center',
  //   paddingVertical:20
  // },
  // flexgrow:{
  //   flexGrow:1,
  //   flexShrink:1
  // },
  // greytt:{
  //   color:Color.textgrey,
  //   textAlign:'center',
  //   width:'60%',
  //   alignSelf:'center',
  //   fontFamily:Config.regulartt
  // },
  // bullettt:{
  //   color:Color.textgrey,
  //   fontSize:14,
  //   marginLeft:10,
  //   fontFamily:Config.regulartt
  // },
  // bullet:{
  //   backgroundColor:Color.textgrey,
  //   height:7,
  //   width:7,
  //   borderRadius:100,
  //   marginTop:7,
  //   fontFamily:Config.regulartt
  // },
  // bulletitem:{
  //   flexDirection:"row",
  //   justifyContent:'flex-start',
  //   alignItems:'flex-start',
  //   alignContent:'flex-start',
  //   width:'80%',
  //   alignSelf:'center',
  //   textAlignVertical:'top',
  //   marginBottom:15
  // },
  // scrollbarctn:{
  //   paddingBottom:20
  // },
  // arrownextbtn:{
  //   backgroundColor:Color.deepblue,
  //   height:45,
  //   width:45,
  //   justifyContent:'center',
  //   alignItems:'center',
  //   borderRadius:100
  // },
  // naminginput:{
  //   // backgroundColor:'#123',
  //   flex:1,
  //   paddingHorizontal:20,
  //   paddingVertical:10,
  //   color:'#fff',
  //   fontFamily:Config.regulartt
  // },
  // namingctn:{
  //   flexDirection:'row',
  //   alignItems:'center',
  //   // backgroundColor:Color.greyblue,
  //   backgroundColor:"rgba(56,52,216,0.3)",
  //   marginTop:20,
  //   borderRadius:100,
  //   width:300,
  //   alignSelf:'center',
  // },
  headerwhite:{
    color:"#fff",
    textAlign:'center',
    // fontWeight:'bold',
    fontFamily:Config.boldtt
  },
  indicatorchild:{
    flex:1
  },
  // aligncenter:{
  //   justifyContent:'center',
  //   alignContent:'center',
  //   alignItems:'center'
  // },
  // desctt:{
  //   color:"#ccc",
  //   textAlign:'center',
  //   marginTop:10,
  //   fontFamily:Config.regulartt
  // },
  // circlebtntt:{
  //   color:"#fff",
  //   fontFamily:Config.boldtt,
  //   fontSize:17
  // },
  // circlebtn:{
  //   backgroundColor:Color.deepblue,
  //   width:150,
  //   alignSelf:'center',
  //   paddingVertical:15,
  //   paddingHorizontal:20,
  //   borderRadius:100,
  //   justifyContent:'center',
  //   alignItems:'center'
  // },
  centerimg2:{
    height:Config.winwidth * 0.6,
    width:Config.winwidth * 0.6,
    maxWidth:350,
    maxHeight:350,
    marginTop:-50,
    alignSelf:"center",
    // marginTop:40,
    marginBottom:40
  },
  centerimg:{
    height:Config.winwidth * 0.8,
    width:Config.winwidth * 0.8,
    maxWidth:400,
    maxHeight:400,
    alignSelf:"center",
    marginTop:-50,
    // marginTop:40,
    marginBottom:40
  },
  container: {
    flex: 1
  }
});
