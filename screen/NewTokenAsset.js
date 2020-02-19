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
import {TopHeader,TransBar,ScreenLoader} from '../extension/AppComponents'
import { Color, Config, shuffle, DevivationPath, sendToast, callApi } from '../extension/AppInit';
import IoIcon from 'react-native-vector-icons/Ionicons'
import RiveIcon from '../extension/RiveIcon'
import Ripple from 'react-native-material-ripple';
import {showMessage} from "react-native-flash-message";
import * as Animatable from 'react-native-animatable';
import AccountInfoContext from '../context/AccountInfoContext';
import { toJS } from 'mobx'
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import FastImage from 'react-native-fast-image'
import AsyncStorage from '@react-native-community/async-storage';

@inject('walletStore')
@inject('settingStore')
class NewTokenAsset extends Component {
  constructor(props){
    super(props);
    this.state = {
      refreshrender:false,
      selectedWallet:{}
    }
  }
  
  componentDidMount(){
    if(this.props.walletStore.allTokenAsset.length == 0){
      this.props.walletStore.GetAllTokenAssetByNetwork(this.props.settingStore.acctoken,(response)=>{
        // console.log(response)
        if(response.status == 200){
          this.setState({
            refreshrender:true
          })
        }
      },(response)=>{
        console.log(response)
      });
    }
    const {params} = this.props.navigation.state;
    this.setState({
      selectedWallet:params.selectedWallet
    },()=>{
      console.log(this.state.selectedWallet);
    });
  }

  _addTokenAssetToWallet = async(tokenasset) =>{
    tokenasset = toJS(tokenasset);
    // if(this.state.selectedWallet.tokenassetlist.some(x => x.AssetCode.toUpperCase() == tokenasset.AssetCode.toUpperCase() && x.Network == this.props.settingStore.oldnetwork.shortcode)){
    if(this.state.selectedWallet.tokenassetlist.some(x => x.AssetCode.toUpperCase() == tokenasset.AssetCode.toUpperCase())){
      console.log("already have")
      showMessage({
        message: intl.get('Alert.TokenAssetAlreadyExist'),
        type: "warning",
        icon:"warning",
      });
    }else{
      var derivepath = this.state.selectedWallet.derivepath;
      var seed = this.state.selectedWallet.seedphase;
      var walletkey = await this.props.walletStore.GenerateBIP39Address(derivepath + "0", seed);
      tokenasset.PrivateAddress = walletkey.privateaddress;
      tokenasset.PublicAddress = walletkey.publicaddress;
      if(this.state.selectedWallet.isCloud){
        this.screenloader.show();
        this.props.walletStore.InsertTokenAssetToCloudWallet(this.props.settingStore.acctoken,this.state.selectedWallet.publicaddress,[tokenasset],(response)=>{
          this.screenloader.hide();
          console.log(response);
          if(response.status == 200){
            this._UpdateWalletStorage(tokenasset);
          }
        },(response)=>{
          this.screenloader.hide();
          console.log(response);
        })
      }else{
        this._UpdateWalletStorage(tokenasset);
      }
    }
  }

  _UpdateWalletStorage = async(tokenasset) =>{
    try {
      const value = await AsyncStorage.getItem('@wallet')
      // console.log(value);
      if(value !== null) {
        let walletlist = JSON.parse(value);
        if(walletlist.length > 0){
          walletlist.map(async(wallet,index)=>{
            if(wallet.publicaddress == this.state.selectedWallet.publicaddress){
              wallet.tokenassetlist.push(tokenasset);
              await AsyncStorage.setItem('@lastwallet', JSON.stringify(wallet)).then(()=>{

              });
              await AsyncStorage.setItem('@wallet', JSON.stringify(walletlist)).then(()=>{
                showMessage({
                  message: intl.get('Alert.AddedNewAssetToken',{code:tokenasset.AssetCode.toUpperCase()}),
                  type: "success",
                  icon:"success",
                });
                this.props.walletStore.setWallets(walletlist);
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

  _renderItems({item,index}){
    return(
      <Ripple style={styles.rendereditem} onPress={()=> this._addTokenAssetToWallet(item)}>
        <View style={styles.renderediteminner}>
          <FastImage source={{uri:item.LogoUrl}} style={styles.rendereditemicon} resizeMode={'contain'} />
          <Text style={styles.rendereditemtt}>{item.Name}</Text>
        </View>
        <IoIcon name="ios-arrow-forward" color={"#fff"} size={20} />
      </Ripple>
    )
  }
  
  render() {
    return (
      <SafeAreaView style={styles.container}>
          <TransBar />
          <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
            <TopHeader {...this.props} title={intl.get('Common.AddNewTokenAsset').toUpperCase()} addNetwork isclosebtn />
            {this.state.refreshrender || this.props.walletStore.allTokenAsset.length > 0 ?
            <FlatList 
              data={this.props.walletStore.allTokenAsset}
              keyExtractor={(item,index) => index.toString()}
              renderItem={this._renderItems.bind(this)}
              contentContainerStyle={styles.mywalletlistctn}
            />
            : null}
          </LinearGradient>
          <ScreenLoader ref={(r) => this.screenloader = r}/>
      </SafeAreaView>
    );
  }
}

export default NewTokenAsset;  

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
  container: {
    flex: 1
  }
});
