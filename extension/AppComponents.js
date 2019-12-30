import React, {Component,PureComponent} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import Modal from 'react-native-modal'
import countries,{countries_selected} from '../country'
// import country_selected from '../country/country_selected.json'
import currency from '../extension/currency.json'
import IoIcon from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import AntIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import {BaseButton} from 'react-native-gesture-handler'
import { Color, Config } from './AppInit.js';
import LinearGradient from 'react-native-linear-gradient';
import FlashMessage, { showMessage, DefaultFlash } from "react-native-flash-message";
import Ripple from 'react-native-material-ripple';
import RiveIcon from '../extension/RiveIcon'
import * as Animatable from 'react-native-animatable';
import { inject,observer } from 'mobx-react';
import intl from 'react-intl-universal';
import languageStore from '../stores/LanguageStore'
import Menu, { MenuItem } from 'react-native-material-menu';
import {MaterialIndicator} from 'react-native-indicators';
import { toJS } from 'mobx';

export class TransBar extends Component {
  render() {
    return (
      <StatusBar translucent barStyle="light-content" backgroundColor={"transparent"}  />
    );
  }
}

export class CountryPicker extends Component {
  renderItem({item,index}){
    return(
      <View>
        {countries_selected[languageStore.language].includes(item) ?
        <Text style={styles.countrysectionheader}>{intl.get('Common.Popular')}</Text>
        : null }
        {!countries_selected[languageStore.language].includes(item) && countries_selected[languageStore.language].length == index ?
        <Text style={styles.countrysectionheader}>{intl.get('Common.All')}</Text>
        : null }
        <CountryPickerItem {...this.props} item={item} />
      </View>
    )
  }
  render() {
    // console.log(languageStore.language)
    let countrylist = countries_selected[languageStore.language].concat(countries[languageStore.language]);
    return (
      <Modal {...this.props} style={styles.countrypickerctn} useNativeDriver hideModalContentWhileAnimating>
        <View>
          <StatusBar barStyle="light-content" backgroundColor={"#1C1F46"}  />
          <TopHeader title={intl.get('Picker.CountryCallingCode')} isclosebtn backfunc={()=> this.props.onBackButtonPress()} />
          <FlatList
            data={countrylist}
            keyExtractor={(item,index)=>index.toString()}
            renderItem={this.renderItem.bind(this)}
            removeClippedSubviews
          />
        </View>
      </Modal>
    );
    return null;
  }
}

export class CountryPickerItem extends PureComponent {
  render() {
    if(this.props.item.calling_code == null) return null;
    return (
      <TouchableOpacity style={styles.countrypickeritem} onPress={()=> this.props.onSelect(this.props.item.calling_code)}>
        <Text style={styles.countrypickertt}>{`${this.props.item.country} (+${this.props.item.calling_code})`}</Text>
        {this.props.selectedCoutryCode == this.props.item.calling_code ?
        <IoIcon name="md-checkmark" color="#fff" size={15} />
        : null }
      </TouchableOpacity>
    );
  }
}

export class CurrencyPicker extends Component{
  renderItem({item,index}){
    // console.log(item)
    return(
      <TouchableOpacity style={styles.countrypickeritem} onPress={()=> this.props.onSelect(item.currency_name)}>
        <Text style={styles.countrypickertt}>{`${intl.get('Country.' + item.countrycode)} (${item.currency_name})`}</Text>
        {this.props.selectedCurrency == item.currency_name ?
        <IoIcon name="md-checkmark" color="#fff" size={15} />
        : null }
      </TouchableOpacity>
    )
  }
  render(){
    return(
      <Modal {...this.props} style={styles.currencypickerctn}  useNativeDriver hideModalContentWhileAnimating>
        <View style={styles.currencypickerinner}>
          <StatusBar barStyle="light-content" backgroundColor={"rgba(0,0,0,0.7)"}  />
          <TopHeader title="Currency" isclosebtn backfunc={()=> this.props.onBackButtonPress()} />
          <FlatList
            data={currency}
            keyExtractor={(item,index)=>index.toString()}
            renderItem={this.renderItem.bind(this)}
            removeClippedSubviews
          />
        </View>
      </Modal>
    )
  }
}

export class ReusedPicker extends Component{
  render(){
    return(
      <Modal {...this.props} style={styles.currencypickerctn} useNativeDriver hideModalContentWhileAnimating>
        <View style={styles.currencypickerinner}>
          <StatusBar barStyle="light-content" backgroundColor={"rgba(0,0,0,0.7)"}  />
          <TopHeader title={this.props.title} isclosebtn backfunc={()=> this.props.onBackButtonPress()} />
          {this.props.content}
        </View>
      </Modal>
    )
  }
}

export class QRImagePicker extends Component{
  constructor(props){
    super(props);
    this.state = {
      showhideqrimagepicker:false
    }
  }
  show(){
    this.setState({showhideqrimagepicker:true})
  }
  hide(){
    this.setState({showhideqrimagepicker:false})
  }
  onPick(type){
    this.hide();
    this.props.settingStore.PickQRToDecode(type,this.props.onDecode);
  }
  render(){
    return(
      <Modal {...this.props} isVisible={this.state.showhideqrimagepicker} style={styles.currencypickerctn}
      onBackdropPress={()=> this.hide()} onBackButtonPress={()=> this.hide()}  useNativeDriver hideModalContentWhileAnimating>
        <View style={styles.currencypickerinner}>
          <StatusBar barStyle="light-content" backgroundColor={"rgba(0,0,0,0.7)"}  />
          <StatusBar translucent barStyle="light-content" backgroundColor={"#1A1F41"}  />
          <TopHeader title="QR Code Image" isclosebtn backfunc={()=> this.hide()} />
          <Ripple style={styles.countrypickeritem} onPress={()=> this.onPick('photo')}>
            <Text style={styles.countrypickertt}>{intl.get('Picker.TakePhoto')}</Text>
          </Ripple>
          <Ripple style={styles.countrypickeritem} onPress={()=> this.onPick('library')}>
            <Text style={styles.countrypickertt}>{intl.get('Picker.ChoosefromLibrary')}</Text>
          </Ripple>
        </View>
      </Modal>
    )
  }
}

export class ScreenLoader extends Component{
  _isMounted = false;
  constructor(props){
    super(props);
    this.state = {
      showhideloader:false
    }
  }
  componentDidMount(){
    this._isMounted = true;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  show(){
    this._isMounted ? this.setState({showhideloader:true}) : null
  }
  hide(){
    this._isMounted ? this.setState({showhideloader:false}) : null
  }
  render(){
    return(
      <Modal {...this.props} isVisible={this.state.showhideloader}  style={{alignItems:'center'}} hideModalContentWhileAnimating>
        <StatusBar backgroundColor={'rgba(0,0,0,0.7)'} />
        {/* <Image source={require('../resources/fullnamelogo.png')} style={{width:50,height:50}} resizeMode={'contain'} /> */}
        <View >
          <MaterialIndicator color={"#fff"} size={20} trackWidth={2} />
          <Text style={{color:'#fff',fontFamily:Config.boldtt,marginTop:10}}>{intl.get('Common.Loading')}</Text>
        </View>
      </Modal>
    )
  }
}

export class TopHeader extends Component{
  render(){
    return(
      <View style={[styles.topheaderctn,this.props.style]}>
        {this.props.ishome ?
        // <TouchableOpacity style={styles.headericon} onPress={()=> this.props.backfunc()}>
        //   <MCIcon name="dots-horizontal" color={Color.lightbluegreen} size={30}  />
        // </TouchableOpacity>
        <View style={styles.headericon}></View>
        :
        !this.props.noback ?
        <TouchableOpacity onPress={this.props.backfunc ? ()=> this.props.backfunc() : ()=> this.props.navigation.goBack()} style={styles.headericon}>
          {this.props.isclosebtn ?
          <IoIcon name="ios-close" color="#fff" size={30} />
          :
          <IoIcon name="ios-arrow-back" color="#fff" size={25} />
          }
        </TouchableOpacity>
        : 
        <View style={styles.noheadericon}></View> 
        }
        {this.props.ishome ?
          <Text style={[styles.topheadertt,{width:'50%',textAlign:'center'}]} numberOfLines={1} ellipsizeMode={'tail'}>{this.props.title}</Text>
        :
          <Text style={styles.topheadertt}>{this.props.title}</Text>
        }
        {/* {this.props.addNetwork ?
        <Text style={[styles.topheadertt,{color:this.props.settingStore.oldnetwork.color}]}>
          {`- (${this.props.settingStore.oldnetwork.type == "ethnetwork" ? "ETH" : "WAN"}) ${this.props.settingStore.oldnetwork.name}`}
        </Text>
        : null} */}
        {this.props.ishome ?
        <TouchableOpacity style={[styles.headericon,{position:'relative'}]} onPress={()=> this.props.navigation.navigate("ManageWallet",{fromHome:true})}>
            <RiveIcon name={"wallet-menu"} color={Color.lightbluegreen} size={19} />
            {/* <Animatable.View useNativeDriver animation={this.props.totalunread > 0 ? "swing" : null} iterationCount={"infinite"} >
              <RiveIcon name={"wallet-menu"} color={Color.lightbluegreen} size={27} />
            </Animatable.View> */}
            {/* {this.props.totalunread > 0 ?
            <View style={styles.noticationctn}>
              <Text style={styles.noticationtt}>{this.props.totalunread}</Text>
            </View>
            : null } */}
        </TouchableOpacity>
        : null }
        {this.props.istrx ?
        <TouchableOpacity style={styles.headericon} onPress={()=> this.props.goManageWallet()}>
            <RiveIcon name={"setting"} color={Color.lightbluegreen} size={22} />
        </TouchableOpacity>
        : null }
      </View>
    )
  }
}

export class TrxTopHeader extends Component{
  render(){
    return(
      <View style={[styles.topheaderctn,this.props.style]}>
        <View style={{alignItems:'center',flexDirection:'row'}}>
          <TouchableOpacity onPress={this.props.backfunc ? ()=> this.props.backfunc() : ()=> this.props.navigation.goBack()} style={styles.headericon}>
            <IoIcon name="ios-arrow-back" color="#fff" size={25} />
          </TouchableOpacity>
          {/* <Text style={[styles.topheadertt,{width:'72%'}]} ellipsizeMode={'tail'} numberOfLines={1}>{this.props.title}</Text> */}
        </View>
        {!this.props.isPrimary ?
        <Menu
          ref={(r) => this.dropdownmenu = r}
          button={
            <TouchableOpacity style={styles.headericon} onPress={()=> this.dropdownmenu.show()}>
                <EntypoIcon name={"dots-three-vertical"} color={Color.lightbluegreen} size={20} />
            </TouchableOpacity>
          }
          style={{borderRadius:7,overflow:'hidden',backgroundColor:'#343761'}}
          onHidden={this.props.RemoveAsset}
        >
          <Ripple style={styles.dropdownmenuitem} onPress={()=> this.dropdownmenu.hide()}>
            <MCIcon name={"delete"} color={"#fff"} size={20} />
            <Text style={styles.dropdownmenuitemtt}>{intl.get('ManageWallet.RemoveAsset')}</Text>
          </Ripple>
        </Menu>
        : null }
        {this.props.rightComp}
        {/* <TouchableOpacity style={styles.headericon} onPress={()=> this.props.goManageWallet()}>
            <RiveIcon name={"setting"} color={Color.lightbluegreen} size={22} />
        </TouchableOpacity> */}
      </View>
    )
  }
}

export class IndicatorTopHeader extends Component{
  render(){
    return(
      <View style={styles.inditopheaderctn}>
        {!this.props.noback ?
        <TouchableOpacity onPress={this.props.backfunc ? ()=> this.props.backfunc() : ()=> this.props.navigation.goBack()} 
          style={styles.headericon}>
           <IoIcon name="ios-arrow-back" color="#fff" size={25} />
        </TouchableOpacity>
        : 
        <View style={styles.indinoheader}></View> 
        }
        <View style={styles.stepindicator}>
          <View style={this.props.index >= 0 ? styles.stepitem : styles.stepitem2}>
            <View style={styles.stepitemdot}></View>
          </View>
          <View style={styles.stepdivider}></View>
          <View style={this.props.index >= 1 ? styles.stepitem : styles.stepitem2}>
            <View style={styles.stepitemdot}></View>
          </View>
          <View style={styles.stepdivider}></View>
          <View style={this.props.index >= 2 ? styles.stepitem : styles.stepitem2}>
            <View style={styles.stepitemdot}></View>
          </View>
        </View>
        <View style={styles.indinoheader}></View> 
      </View>
    )
  }
}

export class BottomButton extends Component{
  render(){
    return(
      <Ripple style={styles.buttonbuttonctn} activeOpacity={0.9} onPress={this.props.onPress ? () => this.props.onPress() : null}>
        <Text style={styles.buttonbuttontt}>{this.props.title}</Text>
      </Ripple>
    )
  }
}

export class PopModal extends Component{
  render(){
    return(
      <Modal {...this.props} useNativeDriver animationIn="zoomIn" animationOut="zoomOut">
        <View style={styles.popupmodal}>
          <StatusBar translucent barStyle="light-content" backgroundColor={"rgba(0,0,0,0.7)"}  />
          <Text style={styles.popupmodaltt}>{this.props.title}</Text>
          <View style={styles.popupmodalcontent}>
            {this.props.content}
          </View>
          <View style={[styles.leftright,styles.popupmodalbtnctn]}>
            <TouchableOpacity style={styles.linebtn} activeOpacity={0.9} onPress={()=> this.props.onCancel()}>
              <Text style={styles.popupmodalbtntt}>{intl.get('Common.Cancel').toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fillbtn} activeOpacity={0.9} onPress={()=> this.props.onConfirm()}>
              <Text style={styles.popupmodalbtntt}>{intl.get('Common.Confirm').toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }
}

export class FlashAlert extends Component{
  renderFlashMessageIcon(icon = 'success', style = {}, customProps = {}) {
    switch (icon) {
      case 'success': 
        return (
          <IoIcon name="ios-checkmark-circle-outline" size={25} color={"#fff"} />
        );
      case 'danger': 
        return (
          <IoIcon name="ios-information-circle-outline" size={25} color={"#fff"} />
        );
      case "warning":
        return(
          <AntIcon name="warning" size={25} color={"#fff"}/>
        );
      default:
        // if not a custom icon render the default ones...
        return renderFlashMessageIcon(icon, style, customProps);
    }
  }

  render(){
    return(
      <FlashMessage {...this.props} position="top" style={styles.flashmsg} 
        renderFlashMessageIcon={this.renderFlashMessageIcon.bind(this)}
        titleStyle={styles.flashtt}
      />
    )
  }
}

export class NumberPad extends Component{
  renderNums(){
    var numparents = [];
    for(var parent = 0; parent < 4; parent++){
      numparents.push(
        <View key={parent} style={styles.numparent}>
          {this.renderNumsChild(parent == 3,parent)}
        </View>
      )
    }
    return numparents;
  }

  renderNumsChild(islast,parent){
    var numsChilds = [];
    for(var child = 1; child < 4; child ++){
      let value = child + (parent * 3);
      if(islast){
        if(child == 1 && !this.props.hidedot){
          value= ".";
        }
        if(child == 2){
          value= "0";
        }
      }
      !islast ?
      numsChilds.push(
        <TouchableOpacity key={child} style={styles.numschild} onPress={()=> this.props.onEnter(value)}>
          <Text style={styles.numschildtt}>{value}</Text>
        </TouchableOpacity>
      )
      :
      numsChilds.push(
        <TouchableOpacity key={child} style={styles.numschild} onPress={ child == 3 ? ()=> this.props.onRemove() : ()=> this.props.onEnter(value)}>
          {child == 1 && !this.props.hidedot ?
          <Text style={styles.numschildtt}>{value}</Text>
          : null }
          {child == 2 ?
          <Text style={styles.numschildtt}>{value}</Text>
          : null }
          {child == 3 ?
          <IoIcon name="md-close" color={"#fff"} size={30} />
          : null }
        </TouchableOpacity>
      )
    }
    return numsChilds;
  }
  render(){
    return this.renderNums();
  }
}

export class ProceedButton extends Component{
  render(){
    return(
      <View style={[styles.proceedbtnctn,this.props.style]}>
        <TouchableOpacity style={styles.proceedbtn}
        onPress={!this.props.isload ? this.props.onPress ? ()=> this.props.onPress() : null : null}>
          {!this.props.isload ?
          <IoIcon name="ios-arrow-forward" color={"#fff"} size={30} />
          :
          <MaterialIndicator color="#fff" size={20} trackWidth={2} />
          }
        </TouchableOpacity>
      </View>
    )
  }
}

export class Refreshing extends Component{
  render(){
    return(
      <RefreshControl colors={[Color.deepblue]} tintColor={Color.deepblue} {...this.props} size={20} />
    )
  }
}

const styles = StyleSheet.create({
  dropdownmenuitem:{
    alignItems:'center',
    flexDirection:'row',
    padding:10
  },
  dropdownmenuitemtt:{
    fontFamily:Config.regulartt,
    color:"#fff",
    fontSize:16,
    paddingLeft:10
  },
  fullnamelogo:{
    width:50
  },
  noticationctn:{
    backgroundColor:Color.deepblue,
    position:'absolute',
    bottom:10,
    right:7,
    height:20,
    width:20,
    borderRadius:100,
    alignItems:'center',
    justifyContent:'center'
  },
  noticationtt:{
    color:'#fff',
    fontFamily:Config.regulartt,
    textAlign:'center',
    fontSize:13
  },
  countrysectionheader:{
    paddingHorizontal:20,
    fontFamily:Config.regulartt,
    color:'#fff',
    backgroundColor:Color.rowblue,
    paddingVertical:7
  },
  indinoheader:{
    width:50
  },
  inditopheaderctn:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    backgroundColor:"transparent",
    width:"100%",
    height:50
  },
  stepdivider:{
    width:60,
    height:1,
    backgroundColor:'rgba(255,255,255,0.2)',
    marginLeft:10,
    marginRight:10
  },
  stepitemdot:{
    height:5,
    width:5,
    borderRadius:100,
    backgroundColor:'#fff'
  },
  stepitem2:{
    borderWidth:1,
    borderColor:'transparent',
    borderRadius:100,
    padding:10
  },
  stepitem:{
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)',
    borderRadius:100,
    padding:10
  },
  stepindicator:{
    justifyContent:'space-between',
    alignContent:'center',
    alignItems:'center',
    flexDirection:'row'
  },
  proceedbtnctn:{
    justifyContent:'flex-end',
    alignContent:'flex-end',
    alignItems:'flex-end',
    flexDirection:'row',
    width:Config.winwidth * 0.8,
    maxWidth:400,
    marginTop:70
  },
  proceedbtn:{
    borderWidth:1,
    borderColor:'#fff',
    borderRadius:100,
    height:50,
    width:50,
    justifyContent:'center',
    alignItems:'center'
  },
  numschildtt:{
    color:"#fff",
    fontWeight:'bold',
    fontSize:25
  },
  numschild:{
    height:40,
    width:"30%",
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    // backgroundColor:'rgba(255,255,255,0.1)'
  },
  numparent:{
    justifyContent:'space-between',
    alignItems:'center',
    flexDirection:'row',
    minWidth:300,
    width:"70%",
    maxWidth:400,
    marginBottom:28,
    // backgroundColor:"#ccc"
  },
  flashtt:{
    color:"#fff",
    fontSize:15,
    marginLeft:15,
    fontWeight:'bold'
  },
  flashmsg:{
    paddingTop:Config.statusBarHeight + 5,
    alignItems:"center",
  },
  popupmodalbtntt:{
    color:'#fff'
  },
  popupmodalcontent:{
    marginTop:25,
    marginBottom:35,
    width:"100%"
  },
  fillbtn:{
    borderWidth:1,
    borderColor:"#2D2CA0",
    borderRadius:100,
    paddingVertical:10,
    paddingHorizontal:20,
    minWidth:90,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:"#2D2CA0",
    fontFamily:Config.regulartt
  },
  linebtn:{
    borderWidth:1,
    borderColor:"#fff",
    borderRadius:100,
    paddingVertical:10,
    paddingHorizontal:20,
    minWidth:90,
    justifyContent:'center',
    alignItems:'center',
    fontFamily:Config.regulartt
  },
  popupmodalbtnctn:{
    width:'80%'
  },
  leftright:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between'
  },
  popupmodaltt:{
    color:'#fff',
    fontSize:16,
    // fontWeight:'bold',
    fontFamily:Config.regulartt
  },
  popupmodal:{
    minHeight:200,
    borderRadius:15,
    padding:20,
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    flexDirection:'column',
    backgroundColor:"#232646"
  },
  buttonbuttontt:{
    color:'#fff',
    // fontWeight:'bold'
    fontFamily:Config.boldtt,
    fontSize:15
  },
  buttonbuttonctn:{
    backgroundColor:Color.deepblue,
    justifyContent:'center',
    alignItems:'center',
    paddingVertical:15,
    maxHeight:50
  },
  noheadericon:{
    paddingLeft:20
  },
  headericon:{
    height:50,
    width:50,
    // backgroundColor:'#ccc',
    justifyContent:'center',
    alignItems:'center'
  },
  topheadertt:{
    fontSize:15,
    color:"#fff",
    fontFamily:Config.boldtt
  },
  topheaderctn:{
    flexDirection:"row",
    justifyContent:"flex-start",
    alignItems:"center",
    backgroundColor:"transparent",
    width:"100%",
    // paddingHorizontal:20,
    // backgroundColor:"#123",
    height:50
  },
  countrypickertt:{
    fontSize:14,
    color:"#fff"
  },
  countrypickeritem:{
    borderBottomWidth:1,
    borderBottomColor:"#303554",
    padding:20,
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center"
  },
  currencypickerinner:{
    backgroundColor:"#1A1F41",
  },
  currencypickerctn:{
    margin:0,
    // backgroundColor:"#1A1F41",
    paddingTop:Config.statusBarHeight,
    justifyContent: 'flex-end',
  },
  countrypickerctn:{
    margin:0,
    backgroundColor:"#1A1F41",
    paddingTop:Config.statusBarHeight
  }
});
