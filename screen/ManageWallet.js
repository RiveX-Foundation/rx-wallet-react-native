import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  BackHandler,
  ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, PopModal, FlashAlert , ReusedPicker} from '../extension/AppComponents';
import { Color, Config, isNullOrEmpty, numberWithCommas, isObjEmpty } from '../extension/AppInit';
import IoIcon from 'react-native-vector-icons/Ionicons'
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import {showMessage} from "react-native-flash-message";
import AsyncStorage from '@react-native-community/async-storage';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';
import AccountInfoContext from '../context/AccountInfoContext';
import intl from 'react-intl-universal';
import Ripple from 'react-native-material-ripple';
import abiArray from '../contractabi/tokenabi.json'
const Web3 = require('web3');
import { observer, inject } from 'mobx-react';
import { toJS, autorun } from 'mobx';
import iWanUtils from '../utils/iwanUtils';

@inject('walletStore')
@inject('settingStore')
@observer
class ManageWallet extends Component {
  constructor(props){
    super(props);
    this.state = {
      walletList:[],
      showhideremovemodal:false,
      selectedRemoveWallet:{},
      currentindex:0,
      selectedWallet:{},
      showhideediwalletname:false,
      selectedWalletName:"",
      showhideexportkey:false,
      isfromHome:false,
      totalworthprice:[],
      updatedresult:false,
      currentHomeWallet:{},
      showhideexportkeypicker:false,
      showhideexportseed:false
    }
    this.quequtokenInterval = null;
    this.quequtoken = false;
  }

  componentDidMount(){
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackManageWallet);
    }
    this.props.walletStore.setReloadManageWallet(this._loadWallet);
    this._loadWallet();
    this._checkJumpToWallet();
    this._isFromHome();
    this._getCurrentHomeWallet();
    // autorun(() => {
    //   console.log(toJS(this.props.walletStore.walletlist), this.state.walletList)
    // });
  }

  componentWillUnmount(){
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackManageWallet);
    }
  }

  _isFromHome = () =>{
    const {params} = this.props.navigation.state;
    if(params){
      if(params.fromHome){
        this.setState({
          isfromHome:true
        })
      }
    }
  }

  _getCurrentHomeWallet = () =>{
    let currentHomeWallet = toJS(this.props.walletStore.currentHomeWallet);
    if(!isObjEmpty(currentHomeWallet)){
      this.setState({
        currentHomeWallet:currentHomeWallet
      })
    }
  }

  stepBackManageWallet = () =>{
    this._stepGoBackManageWallet();
    return true;
  }

  _stepGoBackManageWallet = () =>{
    let currentindex = this.state.currentindex;
    if(currentindex == 0){
      this.props.navigation.goBack();
    }else{
      currentindex--;
      this.managewallettab.setPage(currentindex);
      let position = {position:currentindex};
      this._onchangeSelectedIndex(position);
      // if(currentindex == 0 && Platform.OS == "android"){
      //   BackHandler.removeEventListener('hardwareBackPress', this.stepBackManageWallet);
      // }
    }
    if(currentindex != 2){
      clearInterval(this.state.countdowntimer);
    }
  }

  // _loadWallet = () => {
  //   let filterwalletList = this.props.walletStore.walletlist.filter(x => x.userid == this.props.settingStore.accinfo.Id);
  //   // filterwalletList = filterwalletList.filter(x => x.network == this.props.settingStore.oldnetwork.shortcode);
  //   if(filterwalletList.length > 0){
  //     const web3 = new Web3(this.props.settingStore.oldnetwork.infuraendpoint);
  //     filterwalletList.map((wallet,index)=>{
  //       wallet.tokenassetlist.filter(x => x.Network == this.props.settingStore.oldnetwork.shortcode).map(async(tokenitem,index) =>{
  //         if(tokenitem.TokenType == "eth"){
  //           web3.eth.getBalance(wallet.publicaddress).then(balance => { 
  //             balance = balance / (10**18);
  //             tokenitem.TokenBalance = balance;
  //             this.setState({
  //               totalworthprice:this.state.totalworthprice.concat(balance)
  //             })
  //           })
  //         }else{
  //           var TokenInfo = tokenitem.TokenInfoList.find(x => x.Network == this.props.settingStore.oldnetwork.shortcode);
  //           var tokenAbiArray = JSON.parse(TokenInfo.AbiArray);
  //           // Get ERC20 Token contract instance
  //           let contract = new web3.eth.Contract(tokenAbiArray, TokenInfo.ContractAddress);
  //           web3.eth.call({
  //             to: !isNullOrEmpty(TokenInfo.ContractAddress) ? TokenInfo.ContractAddress : null,
  //             data: contract.methods.balanceOf(wallet.publicaddress).encodeABI()
  //           }).then(balance => {  
  //             balance = balance / (10**18);
  //             tokenitem.TokenBalance = balance;
  //             this.setState({
  //               totalworthprice:this.state.totalworthprice.concat(balance)
  //             })
  //           });
  //         }
  //       });
  //     });
  //   }
  //   this.setState({
  //     walletList:filterwalletList
  //   })
  // }

  _loadWallet = () => {
    // let BeforeFilterList = [];
    // let FinalFilterList = [];
    let filterwalletList = toJS(this.props.walletStore.walletlist).filter(x => x.userid == this.props.settingStore.accinfo.Id);
    this.setState({
      walletList:filterwalletList
    },()=>{
      if(filterwalletList.length > 0){
        try{
          this._queqeLoadTokenAsset(filterwalletList);
          // iWanUtils._checkswitchnetwork(toJS(this.props.settingStore.selectedWANNetwork));
          // filterwalletList.map((wallet,index)=>{
          //   if(wallet.tokenassetlist.length == 0){
          //     let walletitem = {
          //       index:index,
          //       wallet:wallet
          //     }
          //     BeforeFilterList.push(walletitem);
          //   }else{
          //     this.props.walletStore.loadTokenAssetList(wallet).then((value) =>{       
          //       let walletitem = {
          //         index:index,
          //         wallet:value
          //       }
          //       // console.log("loadTokenAssetList", value)
          //       BeforeFilterList.push(walletitem);
          //       // if(index == filterwalletList.length - 1){
          //       //   this.setState({
          //       //     updatedresult:true,
          //       //     walletList:BeforeFilterList
          //       //   })
          //       // }
          //       if(index == filterwalletList.length - 1){
          //         // purpose for this, is to make sure the wallet order is correct before load balance
          //         // console.log("BeforeFilterList length", BeforeFilterList.length, BeforeFilterList.sort((a,b)=> a.index - b.index).length)
          //         BeforeFilterList.sort((a,b)=> a.index - b.index).map((final,finalindex)=>{
          //           // console.log(finalindex)
          //           FinalFilterList.push(final.wallet);
          //           if(finalindex == BeforeFilterList.length - 1){
          //             this.setState({
          //               updatedresult:true,
          //               walletList:FinalFilterList
          //             })
          //           }
          //         })
          //       }
          //     })
          //   }
          // });
        }catch(e){
          console.log(e)
        }
      }
    })
  }

  _queqeLoadTokenAsset = (filterwalletList) =>{
    let currentindex = 0;
    let BeforeFilterList = [];
    let totalwallet = filterwalletList.length;
    // console.log("totalwallet" , totalwallet)
    clearInterval(this.quequtokenInterval);
    this.quequtokenInterval = setInterval(()=>{
      // console.log("on interval")
      if(!this.state.quequtoken){
        this.quequtoken = true;
        let currentWallet = filterwalletList[currentindex];
        // console.log("currentWallet", currentWallet)
        this.props.walletStore.loadTokenAssetList(currentWallet).then((value) =>{   
          // console.log("currentWallet output", currentWallet)
          this.quequtoken = false;
          currentindex++;
          BeforeFilterList.push(value);
          if(currentindex == totalwallet){
            clearInterval(this.quequtokenInterval);
            this.setState({
              updatedresult:true,
              walletList:BeforeFilterList
            })
          }
        });
      }
    },1000);
  }

  _checkJumpToWallet = () =>{
    const {params} = this.props.navigation.state;
    if(params != undefined && params.jumptoWallet != null && params.jumptoWallet != undefined){
      this._onSelectWallet(params.jumptoWallet);
    }
  }

  _getTotalWorth(wallet){
    // var totalworth = 0;
    // if(!isObjEmpty(wallet)){
    //   wallet.tokenassetlist = wallet.tokenassetlist.filter(x => x.Network == this.props.settingStore.oldnetwork.shortcode);
    //   if(wallet.tokenassetlist.length > 0){
    //     wallet.tokenassetlist.map((asset,index)=>{
    //       totalworth += asset.TokenBalance;
    //     })
    //   }
    // }
    // return `$${numberWithCommas(parseFloat(!isNaN(this.props.settingStore.convertrate * totalworth) ? this.props.settingStore.convertrate * totalworth : 0),true)}`;
    return `$${numberWithCommas(parseFloat(!isNaN(wallet.totalassetworth) ? wallet.totalassetworth : 0),true)}`;
  }

  renderItem({item,index}){
    let isSelectedWallet = false;
    if(item.publicaddress == this.state.currentHomeWallet.publicaddress){
      isSelectedWallet = true;
      item = this.state.currentHomeWallet;
    } 
    return(
      <View>
        <Ripple style={[styles.mywalletitem,index === this.state.walletList.length -1 ? {borderBottomWidth:0} : null]}
        onPress={!this.state.isfromHome ? ()=> this._onSelectWallet(item) : ()=> this._onSelectHomeWallet(item)}>
          <Text style={styles.mywalletname}>{item.walletname}</Text>
          {!isSelectedWallet ?
          <Text style={styles.mywalletvalue}>{this.state.updatedresult ? `${this._getTotalWorth(item)} ${this.props.settingStore.settings.currency}` : `...`}</Text>
          :
          <Text style={styles.mywalletvalue}>{this._getTotalWorth(item)} {this.props.settingStore.settings.currency}</Text>
          }
          {/* <Text style={styles.mywalletvalue}>{intl.get('ManageWallet.TotalTokenAsset',{total:item.tokenassetlist.length})}</Text> */}
        </Ripple>
        {!this.state.isfromHome ?
        <TouchableOpacity style={styles.removebtn} activeOpacity={0.9} onPress={()=> this._selectWalletToRemove(item)}>
          <IoIcon name="ios-close" color={"#fff"} size={25} />
        </TouchableOpacity> 
        : null }
      </View>
    )
  }

  _onSelectWallet = (wallet) =>{
    // this.props.walletStore.loadTokenAssetList(wallet).then((value) =>{   

    // });
    this.setState({
      selectedWallet:wallet,
      selectedWalletName:wallet.walletname
    },()=>{
      // console.log(this.state.selectedWallet.seedphase);
      this.managewallettab.setPage(1)
    })
  }

  _onSelectHomeWallet = async(wallet) =>{
    await AsyncStorage.setItem('@lastwallet', JSON.stringify(wallet)).then(()=>{
      this.props.walletStore.homeSelectedWallet(wallet);
      this.props.navigation.goBack();
    });
  }

  _selectWalletToRemove = (wallet) =>{
    // console.log(wallet);
    this.setState({
      selectedRemoveWallet:wallet
    },()=>{
      this._showhideRemoveModal();
    })
  }

  _showhideRemoveModal = () =>{
    this.setState({
      showhideremovemodal:!this.state.showhideremovemodal
    })
  }

  _showhideEditWalletName = () =>{
    this.setState({
      showhideediwalletname:!this.state.showhideediwalletname
    })
  }

  _showhideExportKey = () =>{
    this.setState({
      showhideexportkey:!this.state.showhideexportkey
    })
  }

  _showhideExportMnemonicPhrase = () =>{
    this.setState({
      showhideexportseed:!this.state.showhideexportseed
    })
  }

  _confirmRemoveWallet = () =>{
    // console.log("_confirmRemoveWallet");
    try{
      if(this.state.selectedRemoveWallet.wallettype == "Shared" && this.state.selectedRemoveWallet.isOwner){
        // console.log("from 1")
        this.props.walletStore.RemoveMultiSigWallet(this.props.settingStore.acctoken,this.state.selectedRemoveWallet.publicaddress,(response)=>{
          // console.log("RemoveMultiSigWallet", response)
          if(response.status == 200){
            this._totallyRemoveFromLocal();
          }
        },(response)=>{
  
        })
      }
      if(this.state.selectedRemoveWallet.wallettype == "Basic" && this.state.selectedRemoveWallet.isCloud){
        // console.log("from 2")
        this.props.walletStore.RemoveMultiSigWallet(this.props.settingStore.acctoken,this.state.selectedRemoveWallet.publicaddress,(response)=>{
          // console.log("RemoveMultiSigWallet", response)
          if(response.status == 200){
            this._totallyRemoveFromLocal();
          }
        },(response)=>{

        })
      }
      if(this.state.selectedRemoveWallet.wallettype == "Shared" && !this.state.selectedRemoveWallet.isOwner){
        // console.log("from 3")
        this.props.walletStore.ExitMultiSigWallet(this.props.settingStore.acctoken,this.state.selectedRemoveWallet.publicaddress,(response)=>{
          // console.log("ExitMultiSigWallet", response)
          if(response.status == 200){
            this._totallyRemoveFromLocal();
          }
        },(response)=>{
  
        })
      }
      if(this.state.selectedRemoveWallet.wallettype == "Basic" && !this.state.selectedRemoveWallet.isCloud){
        this._totallyRemoveFromLocal();
        // console.log("from 4")
      }
    }catch(e){

    }
  }

  _totallyRemoveFromLocal = () =>{
    this.setState({
      walletList:this.state.walletList.filter(x => x.publicaddress != this.state.selectedRemoveWallet.publicaddress)
    },async()=>{
      console.log("_totallyRemoveFromLocal", this.state.walletList, this.state.selectedRemoveWallet)
      try {
        await AsyncStorage.setItem('@wallet', JSON.stringify(this.state.walletList)).then(async()=>{
          if(this.state.walletList.length > 0){
            this.props.walletStore.setWallets(this.state.walletList);
            this.props.walletStore.homeSelectedWallet(this.props.walletStore.walletlist[0]);
            const lastwalletvalue = await AsyncStorage.getItem('@lastwallet');
            if(!isNullOrEmpty(lastwalletvalue)){
              let lastwallet = JSON.parse(lastwalletvalue);
              if(this.state.selectedRemoveWallet.publicaddress == lastwallet.publicaddress){
                await AsyncStorage.setItem('@lastwallet','');
              }
            }
          }else{
            await AsyncStorage.setItem('@lastwallet','');
          }
          this.props.walletStore.reloadWallet();
          this._showhideRemoveModal();
          this.managewallettab.setPage(0);
          showMessage({
            message: intl.get('Alert.SuccessfullyRemoved'),
            type: "success",
            icon:"success",
            // autoHide:false
          });
        })
      } catch (e) {
        console.log(e);
        // saving error
      }
    });
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  _confirmEditWalletName = async() =>{
    let currentSelectedWallet = this.state.selectedWallet;
    currentSelectedWallet.walletname = this.state.selectedWalletName;
    let walletList = this.props.walletStore.walletlist;
    // console.log(currentSelectedWallet);
    // console.log(walletList);
    try {
      await AsyncStorage.setItem('@wallet', JSON.stringify(walletList)).then(()=>{
        this.props.walletStore.setWallets(walletList);
        this.props.walletStore.reloadWallet();
        this._showhideEditWalletName();
        showMessage({
          message: intl.get('Alert.SuccessfullyEditWalletName'),
          type: "success",
          icon:"success",
          // autoHide:false
        });
      })
    } catch (e) {
      console.log(e);
      // saving error
    }
  }

  _confirmExportKey = () =>{
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackManageWallet);
    }
    this.props.navigation.navigate("ExportKey",{selectedWallet:this.state.selectedWallet,onBack:this._onBacktoManage});
    this._showhideExportKey();
  }

  _confirmExportMnemonicPhrase = () =>{
    if(Platform.OS == "android"){
      BackHandler.removeEventListener('hardwareBackPress', this.stepBackManageWallet);
    }
    this.props.navigation.navigate("ExportSeed",{selectedWallet:this.state.selectedWallet,onBack:this._onBacktoManage});
    this._showhideExportMnemonicPhrase();
  }

  _onBacktoManage = () =>{
    if(Platform.OS == "android"){
      BackHandler.addEventListener("hardwareBackPress", this.stepBackManageWallet);
    }
  }

  _addNewWallet = () =>{
    if(!this.state.isfromHome){
      this.props.walletStore.setFromManageWallet(true);
    }
    this.props.navigation.replace("NewWallet");
  }

  _showhideexportkeypicker = () =>{
    this.setState({
      showhideexportkeypicker:!this.state.showhideexportkeypicker
    })
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={!this.state.isfromHome ? this.state.currentindex < 1 ? intl.get('ManageWallet.MANAGEWALLET') : "" : intl.get('ManageWallet.MyWallet').toUpperCase()} backfunc={()=> this._stepGoBackManageWallet()} />
          <IndicatorViewPager ref={(r) => this.managewallettab = r} style={styles.container} horizontalScroll={false} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={styles.indicatorchild}>
              <ScrollView>
                <View>
                  <FlatList 
                    data={this.state.walletList}
                    extraData={this.state}
                    keyExtractor={(item,index)=> index.toString()}
                    renderItem={this.renderItem.bind(this)}
                    // contentContainerStyle={{height:Config.availableHeight,flex:1}}
                  />
                </View>
                <TouchableOpacity style={styles.addnewbtn} activeOpacity={0.9} onPress={()=> this._addNewWallet()}>
                  <IoIcon name="ios-add-circle-outline" color={Color.lightbluegreen} size={20} />
                  <Text style={styles.addnewtt}>{intl.get('Common.AddNewWallet').toUpperCase()}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.indicatorchild}>
              {this.state.selectedWallet.userid != "" ?
              <View>
                <Ripple style={styles.managewalletitem} onPress={()=> this._showhideEditWalletName()}>
                  <Text style={styles.managewalletitemtt}>{this.state.selectedWallet.walletname}</Text>
                  <MaIcon name={"circle-edit-outline"} color={Color.textgrey} size={20} />
                </Ripple>
                <Ripple style={styles.managewalletitem}>
                  <Text style={styles.managewalletitemtt}>{this._getTotalWorth(this.state.selectedWallet)} {this.props.settingStore.settings.currency}</Text>
                </Ripple>
                {!isNullOrEmpty(this.state.selectedWallet.seedphase) ?
                <Ripple style={styles.managewalletitem} onPress={()=> this._showhideExportMnemonicPhrase()}>
                  <Text style={styles.managewalletitemtt}>{intl.get('ManageWallet.ExportMnemonicPhrase')}</Text>
                  <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
                </Ripple>
                : null }
                <Ripple style={styles.managewalletitem} onPress={()=> this._showhideExportKey()}>
                  <Text style={styles.managewalletitemtt}>{intl.get('ManageWallet.ExportPrivateKey')}</Text>
                  <IoIcon name="ios-arrow-forward" color={Color.textgrey} size={20} />
                </Ripple>
                <Ripple style={[styles.managewalletitem,{backgroundColor:"rgba(96,52,68,0.5)",borderBottomWidth:0,marginTop:10}]} 
                onPress={()=> this._selectWalletToRemove(this.state.selectedWallet)}>
                  <Text style={[styles.managewalletitemtt,{color:"#EF3333"}]}>{intl.get('ManageWallet.RemoveWallet')}</Text>
                </Ripple>
              </View>
              : null }
            </View>
          </IndicatorViewPager>
        </LinearGradient>
        <PopModal isVisible={this.state.showhideexportkey} 
          title={intl.get('Common.WARNING')}
          content={
            <View style={styles.exportkeyctn}>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportPrivateKey.Msg1')}</Text>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportPrivateKey.Msg2')}</Text>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportPrivateKey.Msg3')}</Text>
            </View>
          } 
          onCancel={()=> this._showhideExportKey()}
          onConfirm={()=> this._confirmExportKey()}
        />
        <PopModal isVisible={this.state.showhideexportseed} 
          title={intl.get('Common.WARNING')}
          content={
            <View style={styles.exportkeyctn}>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportMnemonic.Msg1')}</Text>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportMnemonic.Msg2')}</Text>
              <Text style={styles.exportkeytt}>{intl.get('ManageWallet.ExportMnemonic.Msg3')}</Text>
            </View>
          } 
          onCancel={()=> this._showhideExportMnemonicPhrase()}
          onConfirm={()=> this._confirmExportMnemonicPhrase()}
        />
        <PopModal isVisible={this.state.showhideediwalletname} 
          title={intl.get('ManageWallet.EditWalletName')}
          content={
            <TextInput value={this.state.selectedWalletName} style={styles.editwalletnameinput} 
            onChangeText={(text)=> this.setState({selectedWalletName:text})} />
          } 
          onCancel={()=> this._showhideEditWalletName()}
          onConfirm={()=> this._confirmEditWalletName()}
        />
        <PopModal isVisible={this.state.showhideremovemodal} 
          title={intl.get('ManageWallet.RemoveWallet.Question')}
          content={
            <Text style={styles.popupwalletname}>{this.state.selectedRemoveWallet.walletname}</Text>
          } 
          onCancel={()=> this._showhideRemoveModal()}
          onConfirm={()=> this._confirmRemoveWallet()}
        />
      </SafeAreaView>
    );
  }
}

export default ManageWallet;  

const styles = StyleSheet.create({
  exportkeyctn:{
    width:"80%",
    alignSelf:'center'
  },
  exportkeytt:{
    color:"#fff",
    fontFamily:Config.regulartt,
    marginBottom:15
  },
  editwalletnameinput:{
    fontFamily:Config.regulartt,
    backgroundColor:"#3741A6",
    borderRadius:30,
    width:'90%',
    alignSelf:'center',
    color:"#fff",
    paddingHorizontal:20
  },
  managewalletitemtt:{
    color:'#fff',
    fontFamily:Config.regulartt
  },
  managewalletitem:{
    justifyContent:'space-between',
    paddingHorizontal:20,
    alignItems:'center',
    flexDirection:'row',
    backgroundColor:Color.rowblue,
    paddingVertical:20,
    borderBottomWidth:1,
    borderBottomColor:"#3c4064",
    height:60
  },
  indicatorchild:{
    flex:1
  },
  popupwalletname:{
    fontSize:17,
    color:'#fff',
    fontFamily:Config.boldtt,
    alignSelf:'center'
  },
  removebtn:{
    // backgroundColor:"#123",
    // height:'100%',
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:20,
    position:'absolute',
    height:'100%',
    right:0
  },
  mywalletvalue:{
    color:Color.textgrey,
    fontSize:13,
    marginTop:3,
    fontFamily:Config.regulartt
  },
  mywalletname:{
    color:"#fff",
    fontSize:15,
    fontFamily:Config.regulartt
  },
  mywalletitem:{
    justifyContent:'space-between',
    paddingLeft:20,
    // alignItems:'center',
    flexDirection:'column',
    backgroundColor:Color.rowblue,
    paddingVertical:20,
    borderBottomWidth:1,
    borderBottomColor:"#3c4064"
  },
  addnewbtn:{
    justifyContent:'center',
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:Color.rowblue,
    paddingVertical:20,
    borderTopWidth:1,
    borderTopColor:"#3c4064"
  },
  addnewtt:{
    color:Color.lightbluegreen,
    fontSize:15,
    marginLeft:10
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
