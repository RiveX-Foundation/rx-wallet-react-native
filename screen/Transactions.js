import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import LinearGradientWrapper from 'react-native-linear-gradient';
import { TransBar, TrxTopHeader, Refreshing, PopModal, ScreenLoader } from '../extension/AppComponents';
import { Color, Config, isNullOrEmpty, numberWithCommas,toFixedNoRounding } from '../extension/AppInit';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import IoIcon from 'react-native-vector-icons/Ionicons'
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import RiveIcon from '../extension/RiveIcon'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import axios from 'axios';
import Ripple from 'react-native-material-ripple';
import Menu, { MenuItem } from 'react-native-material-menu';
import { observer, inject } from 'mobx-react';
import moment from 'moment';
import * as Animatable from 'react-native-animatable';
import {showMessage} from "react-native-flash-message";
import { AreaChart, Grid} from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import { Defs, LinearGradient, Stop, Path } from 'react-native-svg'
import { AnimatedSVGPath } from 'react-native-svg-animations';
import intl from 'react-intl-universal';
import FastImage from 'react-native-fast-image'
import AsyncStorage from '@react-native-community/async-storage';
const Web3 = require('web3');
import {MaterialIndicator} from 'react-native-indicators';

const Line = ({ line }) => (
  <AnimatedSVGPath
      key={'line'}
      d={line}
      strokeColor={'rgb(100, 244, 244)'}
      fill={'none'}
      loop={false}
  />
)

const Gradient = ({ index }) => (
  <Defs key={index}>
      <LinearGradient id={'gradient'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
          <Stop offset={'0%'} stopColor={'rgb(100, 244, 244)'} stopOpacity={0.5}/>
          <Stop offset={'10%'} stopColor={'rgb(28, 31, 70)'} stopOpacity={0.1}/>
      </LinearGradient>
  </Defs>
)

@inject('walletStore')
@inject('settingStore')
@observer
class Transactions extends Component {
  constructor(props){
    super(props);
    this.state = {
      transactionlist:[],
      refreshing:false,
      selectedWallet:{},
      selectedToken:{},
      // copayerlist:["Sashimi","Tamago","Sakana","Oden","Sakura"],
      fetchdone:false,
      currentindex:0,
      sparkline:[],
      isPrimary:true,
      showhideremoveasset:false
    }
  }

  componentDidMount(){
    this._getTokenSparkLineByAssetCode();
    const {params} = this.props.navigation.state;
    var TokenInfo = params.selectedToken.TokenInfoList.find(x => x.Network == this.props.settingStore.selectedBlockchainNetwork.shortcode);
    params.selectedWallet.tokenassetlist = params.selectedWallet.tokenassetlist.filter(x => x.Network == this.props.settingStore.selectedBlockchainNetwork.shortcode);
    this.setState({
      selectedWallet:params.selectedWallet,
      selectedToken:params.selectedToken,
      isPrimary:TokenInfo.IsPrimary
    },()=>{
      console.log(this.state.selectedWallet)
      this.walletdetails.setPageWithoutAnimation(this.state.selectedWallet.tokenassetlist.findIndex(x => x.AssetCode == this.state.selectedToken.AssetCode));
      this.LoadTransactionByAddress();
    });
  }

  _getTokenSparkLineByAssetCode = () =>{
    this.props.walletStore.getTokenSparkLineByAssetCode(this.props.settingStore.acctoken,"rvx",(response)=>{
      // console.log(response)
      if(response.status == 200){
        let sparklinelist = response.sparkline.sparkline;
        if(sparklinelist.length > 0){
          // console.log("come come come come");
          let newsparkline = [];
          sparklinelist.map((item,index)=>{
            newsparkline.push(item.value);
          })
          this.setState({
            sparkline:newsparkline
          },()=>{
            // console.log("sparkline", JSON.stringify(this.state.sparkline))
          })
        }else{
          // console.log("come come come come 2");
        }
      }
    },(response)=>{
      console.log(response);
    });
  }

  renderItem({item,index}){
    // console.log(item)
    // if(index ==0) item.shared = true;
    // console.log(item.from,this.state.selectedWallet.publicaddress);
    return(
      <View>
        {/* {index == 0 ?
        <Text style={styles.trxtt}>TRANSACTION HISTORY</Text>
        : null } */}
        <Ripple onPress={()=> this.props.navigation.navigate("TransactionDetail",{selectedWallet:this.state.selectedWallet,selectedToken:this.state.selectedToken,tranxLog:item,onRefresh:this._onRefresh})}>
          <View style={styles.traxitem}>
            {/* <View style={styles.leftright}>
              <IoIcon name={item.type == "up" ? "ios-arrow-round-up" : "ios-arrow-round-down" } 
              color={item.type == "up" ? "#EF3333" : Color.lightbluegreen } size={25} />
              <Text style={[styles.traxitemvalue,{width:'49%'}]} ellipsizeMode={'tail'} numberOfLines={1}>{item.hash}</Text>
              <Text style={styles.traxstatus}>{item.isError == "0" ? "Success" :"Failed" }</Text>
            </View>
            <View style={styles.leftright}>
              <Text style={[styles.traxitemvalue,item.type == "up" ? {color:"#64F44C"}:{color:"#DB3032"}]}>{item.value}</Text>
              <Text style={styles.traxtime}>{moment.unix(item.timeStamp).format("YYYY-MM-DD hh:mm:ss")}</Text>
            </View> */}
            <View style={styles.leftright}>
              <Text style={[styles.traxitemvalue,{fontSize:17},item.from.toLowerCase() == this.state.selectedWallet.publicaddress.toLowerCase() ? {color:"#DB3032"}:{color:"#64F44C"}]}>
              {item.value} RVX
              </Text>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[styles.traxstatus,item.status == "pending" ?  {color:"#DB3032"}:null]}>{item.status == "pending" ? `${intl.get('Transaction.ToBeApprove')} [${item.signers.length}/${this.state.selectedWallet.totalsignatures}]` : intl.get('Transaction.Status.' + this.props.settingStore.Capitalize(item.status))}</Text>
                <Text style={styles.traxtime}>{moment.unix(item.timestamp).format("YYYY-MM-DD hh:mm:ss A")}</Text>
              </View>
            </View>
          </View>
        </Ripple>
      </View>
    )
  }

  _navigateAction = (name) =>{
    if(name == "Send"){
      //remember
      if(this.state.selectedToken.TokenBalance == 0){
        showMessage({
          message: intl.get('Transaction.NotEnoughBalance'),
          type: "warning",
          icon:"warning",
          // autoHide:false
        });
        return;
      }
      this.props.navigation.navigate("Send",{selectedWallet:this.state.selectedWallet,selectedToken:this.state.selectedToken,onRefresh:this._onRefresh})
    }else{
      this.props.navigation.navigate("Receive",{selectedWallet:this.state.selectedWallet,selectedToken:this.state.selectedToken})
    }
  }

  _onRefresh = () =>{
    this.setState({refreshing:true});
    this.LoadTransactionByAddress();
    this._reloadAssetBalance();
  }

  _reloadAssetBalance = () =>{
    const web3 = new Web3(this.props.settingStore.selectedBlockchainNetwork.infuraendpoint);
    if(this.state.selectedToken.TokenType == "eth"){
      web3.eth.getBalance(this.state.selectedWallet.publicaddress).then(balance => { 
        balance = balance / (10**18);
        this.state.selectedToken.TokenBalance = balance;
        // console.log("ETH >> ", this.state.selectedToken.AssetCode , this.state.selectedToken.TokenBalance)
        this.setState({
          selectedToken: this.state.selectedToken
        });
      })
    }else{
      var TokenInfo = this.state.selectedToken.TokenInfoList.find(x => x.Network == this.props.settingStore.selectedBlockchainNetwork.shortcode);
      var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
      // Get ERC20 Token contract instance
      let contract = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
      web3.eth.call({
        to: !isNullOrEmpty(TokenInfo.ContractAddress) ? TokenInfo.ContractAddress : null,
        data: contract.methods.balanceOf(this.state.selectedWallet.publicaddress).encodeABI()
      }).then(balance => {  
        balance = balance / (10**18);
        this.state.selectedToken.TokenBalance = balance;
        // console.log("OTHERS >> ", this.state.selectedToken.AssetCode , this.state.selectedToken.TokenBalance)
        this.setState({
          selectedToken: this.state.selectedToken
        });
      });
    }
  }

  // blockHash: ""
  // blockNumber: ""
  // confirmations: ""
  // contractAddress: ""
  // cumulativeGasUsed: ""
  // from: ""
  // gas: ""
  // gasPrice: ""
  // gasUsed: ""
  // hash: ""
  // input: ""
  // isError: "0"
  // nonce: "18"
  // timeStamp: "1567613328"
  // to: ""
  // transactionIndex: ""
  // txreceipt_status: ""
  // value: ""
  LoadTransactionByAddress(){
    // console.log("LoadTransactionByAddress");
    if(this.state.selectedWallet.wallettype == "Basic"){
      // console.log("Basic");
      this.props.walletStore.LoadTransactionByAddress(this.state.selectedToken.TokenType, this.state.selectedWallet.publicaddress,(response)=>{
        // console.log(JSON.stringify(response));
        this.setState({
          refreshing:false,
          fetchdone:true,
          transactionlist:response
        })
      },(response)=>{
        this.setState({
          refreshing:false,
          fetchdone:true,
          transactionlist:[]
        })
      })
    }else{
      this.props.walletStore.LoadTransactionByAddress(this.state.selectedToken.TokenType, this.state.selectedWallet.publicaddress,(response)=>{
        this.props.walletStore.LoadMultiSigTransactionByAddress(this.props.settingStore.acctoken,this.state.selectedWallet.publicaddress,(sigresponse)=>{
          // console.log(response.trx);
          this.setState({
            refreshing:false,
            fetchdone:true,
            transactionlist:[...response,...sigresponse].sort((a,b)=> b.timestamp - a.timestamp)
          })
        },(response)=>{
          this.setState({
            refreshing:false,
            fetchdone:true,
            transactionlist:[]
          })
        })
      },(response)=>{
        this.setState({
          refreshing:false,
          fetchdone:true,
          transactionlist:[]
        })
      })
    }
  }

  _showhideDropDownMenu = (isShow) =>{
    if(isShow){
      this.dropdownmenu.show();
    }else{
      this.dropdownmenu.hide();
    }
  }

  
  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    var TokenInfo = this.state.selectedWallet.tokenassetlist[index].TokenInfoList.find(x => x.Network == this.props.settingStore.selectedBlockchainNetwork.shortcode);
    this.setState({
      currentindex:index,
      selectedToken:this.state.selectedWallet.tokenassetlist[index],
      transactionlist:[],
      fetchdone:false,
      isPrimary:TokenInfo.IsPrimary
    },()=>{
      this.LoadTransactionByAddress();
    });
  }

  renderTokenAsset(){
    if(this.state.selectedWallet.tokenassetlist){
      this.state.selectedWallet.tokenassetlist.map((tokenasset,index)=>{
        console.log(JSON.stringify(tokenasset.AssetCode))
        return(
          <View style={{backgroundColor:'#000'}} key={index}>
            <Text style={{color:'#fff'}}>{tokenasset.AssetCode}</Text>
          </View>
        )
      }) 
    }
  }

  _RemoveAsset = async() =>{
    if(this.state.selectedWallet.isCloud){
      this.screenloader.show();
      this.props.walletStore.RemoveTokenAssetInCloudWallet(this.props.settingStore.acctoken,this.state.selectedWallet.publicaddress,this.state.selectedToken.AssetCode.toUpperCase(),(response)=>{
        this.screenloader.hide();
        console.log(response);
        if(response.status == 200){
          this._UpdateWalletStorage();
        }
      },(response)=>{
        this.screenloader.hide();
        console.log(response);
      })
    }else{
      this._UpdateWalletStorage();
    }
  }

  _UpdateWalletStorage = async() =>{
    try {
      const value = await AsyncStorage.getItem('@wallet')
      // console.log(value);
      if(value !== null) {
        let walletlist = JSON.parse(value);
        if(walletlist.length > 0){
          walletlist.map(async(wallet,index)=>{
            if(wallet.publicaddress == this.state.selectedWallet.publicaddress){
              // wallet.tokenassetlist = wallet.tokenassetlist.filter(x => x.AssetCode != this.state.selectedToken.AssetCode);
              var deleteindex = wallet.tokenassetlist.findIndex(x => x.AssetCode === this.state.selectedToken.AssetCode && x.Network == this.props.settingStore.selectedBlockchainNetwork.shortcode);
              wallet.tokenassetlist.splice(deleteindex,1);
              await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
                showMessage({
                  message: intl.get('Alert.RemovedAssetToken',{code:this.state.selectedToken.AssetCode.toUpperCase()}),
                  type: "success",
                  icon:"success",
                });
                this.props.walletStore.homeSelectedWallet(wallet);
                this.props.navigation.goBack();
              })
            }
          })
        }
      }
    }catch(e) {
      // error reading value
    }
  }

  _showhideRemoveAsset = () =>{
    this.setState({
      showhideremoveasset:!this.state.showhideremoveasset
    })
  }

  formatCoinBalance(TokenBalance){
    // return TokenBalance;
    // console.log("TokenBalance before >>", TokenBalance)
    try{
      TokenBalance = TokenBalance != undefined || TokenBalance != null ? TokenBalance : 0;
      // console.log("TokenBalance after >>", TokenBalance)
      if(TokenBalance % 1 != 0){
        return toFixedNoRounding(TokenBalance,4);
      }
      return toFixedNoRounding(TokenBalance,2);
    }catch(e){
      console.log("formatCoinBalance >> ", e)
    }
  }

  render() {
    const Tips = ({ x, y, data }) => (
      data.map((value, index) => Math.max(...this.state.sparkline) == value || Math.min(...this.state.sparkline) == value ?(
        
      <View key={index.toString()}
        style={{
          position: 'absolute',
          left:20,
          right:20,
          top: y(value) - 20,
        }}>
          <Text style={styles.sparklinetiptt}>{value}</Text>
        </View>
      ) : null)
    )
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradientWrapper colors={Color.gradientColor} style={Config.linearGradient}>
          <TrxTopHeader {...this.props} title={this.state.selectedWallet.walletname}
          isPrimary={this.state.isPrimary} RemoveAsset={()=> this._showhideRemoveAsset()}
          style={{justifyContent:'space-between'}}/>
          <IndicatorViewPager ref={(r) => this.walletdetails = r} style={styles.container}
            horizontalScroll={true} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            {this.state.selectedWallet.tokenassetlist ? this.state.selectedWallet.tokenassetlist.map((tokenasset,index)=>(
              <View style={styles.indicatorChild} key={index}>
                <ScrollView  refreshControl={
                  <Refreshing refreshing={this.state.refreshing}
                  onRefresh={this._onRefresh}/>}
                >
                {/* This is top */}
                <View style={styles.transactiontop}>
                  <Ripple activeOpacity={0.9} style={[styles.bottomnavbtn]}
                  onPress={()=> this._navigateAction("Receive")}>
                    <RiveIcon name="receive-arrow" color={"#53BC5B"} size={22} />
                  </Ripple>
                  <View style={styles.transactiontopinner}>
                    <FastImage source={{uri:tokenasset.LogoUrl}} style={styles.tokenlogo} resizeMode={'contain'} />
                    <Text style={styles.coinbalance}>{this.formatCoinBalance(tokenasset.TokenBalance)}</Text>
                    <Text style={[styles.coinbalance,{fontSize:20,marginTop:-5}]}>{tokenasset.AssetCode}</Text>
                    <Text style={styles.worthprice}>{`$${numberWithCommas(parseFloat(tokenasset.TokenBalance) * (this.props.settingStore.settings.currency == "USD" ? this.props.settingStore.convertrate : this.props.settingStore.convertrate * 4),true)} ${this.props.settingStore.settings.currency}`}</Text>
                  </View>
                  <Ripple activeOpacity={0.9} style={[styles.bottomnavbtn]}
                  onPress={()=> this._navigateAction("Send")}>
                    <RiveIcon name="send-arrow" color={"#EF3333"} size={22} />
                  </Ripple>
                </View>
                {/* This is end top */}
                <AreaChart
                  style={{ height: 150}}
                  data={this.state.sparkline}
                  contentInset={{ top: 30, bottom: 30 }}
                  curve={shape.curveNatural}
                  svg={{ fill: 'url(#gradient)' }}
                >
                  <Line />
                  <Gradient />
                  <Tips />
                </AreaChart>
                {this.state.transactionlist.length == 0 ?
                <View style={styles.notrxctn}>
                  {this.state.fetchdone ?
                  <Text style={styles.notrxtt}>{intl.get('Transaction.NoTransaction')}</Text>
                  :
                  <MaterialIndicator color={"#fff"} size={20} trackWidth={2} />
                  }
                </View>
                :
                <FlatList
                  data={this.state.transactionlist}
                  keyExtractor={(item,index) => index.toString()}
                  renderItem={this.renderItem.bind(this)}
                  contentContainerStyle={styles.traxlistctn}
                />
                }
              </ScrollView>
            </View>
            )) : null}
          </IndicatorViewPager>
        </LinearGradientWrapper>
        <PopModal isVisible={this.state.showhideremoveasset} 
          title={intl.get('Transaction.RemoveAsset.Question')}
          content={
            <Text style={styles.popupwalletname}>{this.state.selectedToken.AssetCode}</Text>
          } 
          onCancel={()=> this._showhideRemoveAsset()}
          onConfirm={()=> this._RemoveAsset()}
        />
        <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default Transactions;

const styles = StyleSheet.create({
  popupwalletname:{
    fontSize:17,
    color:'#fff',
    fontFamily:Config.boldtt,
    alignSelf:'center'
  },
  sparklinetiptt:{
    color:"#3c9292",
    fontFamily:Config.regulartt,
    fontSize:13
  },
  indicatorChild:{
    flex:1
  },
  flaglefttt:{
    color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    fontSize:14
  },
  flagleftctn:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    borderTopLeftRadius:30,
    borderBottomLeftRadius:30,
    position:'absolute',
    right:0
  },
  tokenlogo:{
    width:37,
    height:37,
    marginBottom:10
  },
  notrxtt:{
    color:"#fff",
    fontFamily:Config.regulartt
  },
  notrxctn:{
    justifyContent:'center',
    alignItems:'center',
    minHeight:Config.availableHeight - 190 - 100
  },
  flexgrow:{
    flexGrow:1,
    flexShrink:1
  },
  flybtn:{
    position:'absolute',
    bottom:5 
  },
  bottomnavbtn:{
    // backgroundColor:'rgba(255,255,255,0.6)',
    height:50,
    width:50,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center',
    overflow:'hidden',

    marginTop:35
  },
  actionbtnctn:{
    position:'absolute',
    flexDirection:'row',
    alignItems:'flex-end',
    // right:20,
    // bottom:-25
  },
  dropdownmenuitem:{
    minWidth:120,
    alignItems:'flex-end'
  },
  dropdownmenuitemctn:{
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    paddingHorizontal:20,
    overflow:'hidden'
  },
  dropdownmenuitemtt:{
    fontFamily:Config.regulartt,
    color:"#fff",
    fontSize:16,
    textAlign:'right',
    // backgroundColor:'#ccc' 
  },
  copayertt:{
    color:Color.shareColor,
    fontFamily:Config.regulartt,
    fontSize:16
  },
  leftright:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row'
  },
  trxtt:{
    fontFamily:Config.regulartt,
    fontSize:15,
    color:'#fff',
    textAlign:'center',
    padding:25
  },
  tabcontainer:{
    backgroundColor:'transparent',
    // paddingTop:10
  },
  tabtt2:{
    color:Color.textgrey,
    fontFamily:Config.regulartt,
    fontSize:14,
    opacity:0.5
  },
  tabtt:{
    // color:Color.lightbluegreen,
    fontFamily:Config.regulartt,
    fontSize:14,
    fontWeight:'normal'
  },
  traxlistctn:{
    paddingTop:30,
    // paddingHorizontal:20, // comment for row
    // paddingVertical:20,
    // paddingBottom:85
  },
  traxtime:{
    // color:"#B8BAC1",
    color:Color.textgrey,
    fontSize:14,
    fontFamily:Config.regulartt
  },
  traxstatus:{
    color:"#B8BAC1",
    fontSize:15,
    fontFamily:Config.regulartt
  },
  traxitemright:{
    alignItems:'flex-end'
  },
  traxitemvalue:{
    // color:"#B8BAC1",
    color:"#66F274",
    fontSize:16,
    // marginLeft:20,
    fontFamily:Config.regulartt
  },
  traxitemleft:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  traxitem:{
    flexDirection:'column',
    // alignItems:'center',
    // justifyContent:'space-between',
    paddingVertical:20,
    // backgroundColor:'rgba(0,0,0,0.5)',
    borderRadius:8,
    // marginBottom:8,
    padding:20,
    //new
    borderBottomWidth:1,
    borderBottomColor:Color.greyblue
  },
  worthprice:{
    color:Color.textgrey,
    fontFamily:Config.regulartt,
    fontSize:13
    // color:Color.textgrey,
    // fontSize:17,
    // marginTop:10,
    // fontFamily:Config.regulartt
  },
  coinbalance:{
    color:Color.lightbluegreen,
    fontSize:30,
    fontFamily:Config.regulartt,
    textAlign:'center'
    // marginTop:10,
    // marginBottom:10
  },
  walletname:{
    color:Color.lightbluegreen,
    fontSize:17,
    fontFamily:Config.regulartt
  },
  transactiontopinner:{
    paddingHorizontal:20,
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    alignSelf:'center',
    // borderColor:"#2D5470",
    // borderWidth:2,
    // height:190,
    width:190,
    // borderRadius:100,
  },
  transactiontop:{
    paddingTop:20,
    // paddingBottom:10,
    // paddingHorizontal:20,
    // backgroundColor:Color.rowblue,
    justifyContent:'center',
    // alignContent:'center',
    alignItems:'center',
    // alignSelf:'center',
    flexDirection:'row',
    marginBottom:20
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
