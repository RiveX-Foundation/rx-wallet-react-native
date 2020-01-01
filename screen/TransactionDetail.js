import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader,ScreenLoader } from '../extension/AppComponents';
import { Color, Config, isObjEmpty } from '../extension/AppInit';
import AccountInfoContext from '../context/AccountInfoContext'
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import Ripple from 'react-native-material-ripple'
import {showMessage} from "react-native-flash-message";
import moment from 'moment'
import { observer, inject } from 'mobx-react';
import Web3 from 'web3';
import intl from 'react-intl-universal';

@inject('walletStore')
@inject('settingStore')
@observer
class TransactionDetail extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedWallet:{},
      selectedToken:{},
      tranxLog:{},
      copayerlist:[],
      istrxapproved:false
    }
  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    console.log(params.tranxLog)
    // params.selectedWallet.wallettype = "Shared";
    this.setState({
      selectedWallet:params.selectedWallet,
      selectedToken:params.selectedToken,
      tranxLog:params.tranxLog
    });
  }

  _renderCoPayer({item,index}){
    return(
      <View style={styles.copayeritemctn}>
        <View style={styles.copayeriteminner}>
          {/* {item.Id == "123" ?
          <IoIcon name={"md-checkmark"} color={"#fff"} size={20} style={{width:20}} />
          :
          <View style={{width:20,alignItems:'flex-start'}}>
            <ActivityIndicator size={18} color={"#fff"} />
          </View>
          } */}
          <IoIcon name={"md-checkmark"} color={"#fff"} size={20} style={{width:20}} />
          <Text style={[styles.whitelabel,{marginTop:0,marginLeft:15}]}>{item.UserName}</Text>
        </View>
      </View>
    )
  }

  _approveTransaction = () =>{
    var isexecute = false;
    if(this.state.selectedWallet.totalsignatures - this.state.tranxLog.signers.length <= 1){
      isexecute = true;
    }
    this.screenloader.show();
    this.props.walletStore.approveMultiSigTransaction(this.props.settingStore.acctoken,this.state.tranxLog.trxid,
    this.state.selectedWallet,this.state.selectedToken,this.state.tranxLog.to,this.state.tranxLog.value.toString(),isexecute,(response)=>{
      this.screenloader.hide();
      if(response.status == 200){
        let newsigners = {
          UserId:this.props.settingStore.accinfo.Id,
          UserName:this.props.settingStore.accinfo.Name
        }
        let updatetrxlog = this.state.tranxLog;
        updatetrxlog.signers.push(newsigners);
        this.setState({
          istrxapproved:true,
          tranxLog:updatetrxlog
        },()=>{
          this.props.navigation.state.params.onRefresh();
          this.props.navigation.goBack();
          showMessage({
            message: "Successfully Approve Transaction",
            type: "success",
            icon:"success",
            // autoHide:false
          });
        });
      }
      console.log(response);
    },(response)=>{
      this.screenloader.hide();
      console.log(response);
      showMessage({
        message: "Invalid Request",
        type: "warning",
        icon:"warning"
      });
    });
  }

  _goToEtherscan = (type,val) =>{
    if(this.state.selectedToken.TokenType == "eth" || this.state.selectedToken.TokenType == "erc20"){
      if(this.props.settingStore.selectedETHNetwork.shortcode == "mainnet"){
        Linking.openURL(`https://etherscan.io/${type}/${val}`);
      }else{
        Linking.openURL(`https://${this.props.settingStore.selectedETHNetwork.shortcode}.etherscan.io/${type}/${val}`);
      }
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={intl.get('TrxDetail.TRANSACTIONDETAILS')} isclosebtn/>
          <ScrollView contentContainerStyle={{paddingBottom:20}}>
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype == "Basic" ?
            <TouchableOpacity activeOpacity={0.9} style={[styles.trxinfoctn,{flexDirection:'column',alignItems:'flex-start'}]}
            onPress={()=> this._goToEtherscan('tx',this.state.tranxLog.trxid)}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Hash')}</Text>
              <View style={[styles.leftright,{width:'100%',marginTop:10}]}>
                <Text style={[styles.trxinfovalue,{flex:1,textAlign:'left',marginRight:20}]}>{this.state.tranxLog.trxid}</Text>
                <RiveIcon name="copy" color={"#fff"} size={22} onPress={()=> this.props.settingStore.copytoclipboard(this.state.tranxLog.trxid)}/>
              </View>
            </TouchableOpacity>
            :
            <View style={[styles.trxinfoctn,{flexDirection:'column',alignItems:'flex-start'}]}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.TransactionID')}</Text>
              <View style={[styles.leftright,{width:'100%',marginTop:10}]}>
                <Text style={[styles.trxinfovalue,{flex:1,textAlign:'left',marginRight:20}]}>{this.state.tranxLog.trxid}</Text>              
              </View>
            </View>
            }
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype != "Shared" ?
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Block')}</Text>
              <Text style={styles.trxinfovalue}>{this.state.tranxLog.block}</Text>
            </View>
            :null}
            <TouchableOpacity activeOpacity={0.9} style={[styles.trxinfoctn,{flexDirection:'column',alignItems:'flex-start'}]}
            onPress={()=> this._goToEtherscan('address',this.state.tranxLog.from)}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.From')}</Text>
              <View style={[styles.leftright,{width:'100%',marginTop:10}]}>
                <Text style={[styles.trxinfovalue,{textAlign:'left',marginRight:20}]} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.tranxLog.from}</Text>
                <RiveIcon name="copy" color={"#fff"} size={22} onPress={()=> this.props.settingStore.copytoclipboard(this.state.tranxLog.from)}/>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={[styles.trxinfoctn,{flexDirection:'column',alignItems:'flex-start'}]}
            onPress={()=> this._goToEtherscan('address',this.state.tranxLog.to)}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.To')}</Text>
              <View style={[styles.leftright,{width:'100%',marginTop:10}]}>
                <Text style={[styles.trxinfovalue,{textAlign:'left',marginRight:20}]} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.tranxLog.to}</Text>
                <RiveIcon name="copy" color={"#fff"} size={22} onPress={()=> this.props.settingStore.copytoclipboard(this.state.tranxLog.to)}/>
              </View>
            </TouchableOpacity>
            {/* <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>From</Text>
              <Text style={styles.trxinfovalue} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.tranxLog.from}</Text>
            </View>
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>To</Text>
              <Text style={styles.trxinfovalue} ellipsizeMode={'tail'} numberOfLines={1}>{this.state.tranxLog.to}</Text>
            </View> */}
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype != "Shared" ?
            <View style={styles.trxinfoctnbig}>
              <View style={[styles.trxinfoctn,styles.trxinfomix]}>
                <Text style={styles.trxinfott}>{intl.get('TrxDetail.Amount')}</Text>
                {/* <Text style={styles.trxinfovalue}>{Web3.utils.fromWei(new Web3.utils.BN(this.state.tranxLog.value), 'ether')}</Text> */}
                <Text style={styles.trxinfovalue}>{this.state.tranxLog.value} {this.state.selectedToken.AssetCode}</Text>
              </View>
              <View style={[styles.trxinfoctn,styles.trxinfomix]}>
                <Text style={styles.trxinfott}>{intl.get('TrxDetail.GasPrice')}</Text>
                <Text style={styles.trxinfovalue}>{this.state.tranxLog.gasprice}</Text>
              </View>
              <View style={[styles.trxinfoctn,styles.trxinfomix]}>
                <Text style={styles.trxinfott}>{intl.get('TrxDetail.GasUsed')}</Text>
                <Text style={styles.trxinfovalue}>{this.state.tranxLog.gasused}</Text>
              </View>
            </View>
            :
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Amount')}</Text>
              <Text style={styles.trxinfovalue}>{this.state.tranxLog.value}</Text>
            </View>
            }
            {this.state.selectedToken.TokenType != "wrc20" && this.state.selectedToken.TokenType != "wan" ?
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.CreatedOn')}</Text>
              <Text style={styles.trxinfovalue}>{moment.unix(this.state.tranxLog.timestamp).format("YYYY-MM-DD hh:mm:ss A")}</Text>
            </View>
            : null }
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype != "Shared" ?
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Nounce')}</Text>
              <Text style={styles.trxinfovalue}>{this.state.tranxLog.nonce}</Text>
            </View>
            :null}
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype != "Shared" ?
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Confirmation')}</Text>
              <Text style={styles.trxinfovalue}>{this.state.tranxLog.confirmation}</Text>
            </View>
            :null}
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype != "Shared" ?
            <View style={styles.trxinfoctn}>
              <Text style={styles.trxinfott}>{intl.get('TrxDetail.Status')}</Text>
              <Text style={styles.trxinfovalue}>{this.state.tranxLog.status ? intl.get('Transaction.Status.' + this.state.tranxLog.status) : ""}</Text>
            </View>
            :null}
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype == "Shared" && !this.state.tranxLog.isblockchain ?
            <View style={[styles.trxinfoctnbig,{backgroundColor:'#3A2739'}]}>
              <View style={[styles.trxinfoctn,styles.trxinfomix]}>
                <Text style={styles.trxinfott}>{intl.get('TrxDetail.TotalSigners')}</Text>
                <Text style={styles.trxinfovalue}>{this.state.tranxLog.signers.length} / {this.state.selectedWallet.totalsignatures}</Text>
              </View>
              <FlatList 
                data={this.state.tranxLog.signers}
                keyExtractor={(item,index) => index.toString()}
                renderItem={this._renderCoPayer.bind(this)}
                contentContainerStyle={styles.copayerlistctn}
              />
            </View>
            : null }
            {!isObjEmpty(this.state.tranxLog) && this.state.selectedWallet.wallettype == "Shared" && this.state.tranxLog.status == "pending" && this.state.tranxLog.action == "Approve" ?
            <View style={styles.approvebtnctn}>
              <Ripple style={styles.approvebtn} onPress={()=> this._approveTransaction()}>
                <Text style={styles.whitelabel}>{intl.get('TrxDetail.Approve')}</Text>
              </Ripple>
            </View>
            : null }
          </ScrollView>
        </LinearGradient>
        <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default TransactionDetail;

const styles = StyleSheet.create({
  trxinfomix:{
    backgroundColor:'transparent',
    paddingHorizontal:0,
    marginBottom:0,
    minHeight:40
  },
  leftright:{
    alignItems:'center',
    flexDirection:'row',
    justifyContent:'space-between'
  },
  approvebtnctn:{
    marginHorizontal:20,
    alignItems:'flex-end',
    marginTop:10
  },
  approvebtn:{
    backgroundColor:Color.deepblue,
    minHeight:55, 
    borderRadius:10,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:15,
    width:100
  },
  whitelabel:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  copayerlistctn:{
    backgroundColor:'#3A2739',
    marginHorizontal:20,
    // paddingHorizontal:20,
    // paddingTop:20,
    borderRadius:10
  },
  copayeriteminner:{
    flexDirection:'row',
    alignItems:'center'
  },
  copayeritemctn:{
    marginBottom:20
  },
  trxinfovalue:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14,
    width:'70%',
    textAlign:'right'
  },
  trxinfott:{
    color:"#fff",
    fontFamily:Config.regulartt,
    fontSize:14
  },
  trxinfoctn:{
    backgroundColor:Color.rowblue,
    paddingHorizontal:20,
    paddingVertical:15,
    marginBottom:10,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginHorizontal:20,
    borderRadius:10,
    minHeight:55, 
  },
  trxinfoctnbig:{
    backgroundColor:Color.rowblue,
    marginHorizontal:20,
    marginBottom:10,
    borderRadius:10,
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
