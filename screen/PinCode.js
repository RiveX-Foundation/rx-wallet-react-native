import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  AppState,
  BackHandler,
  Vibration
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, NumberPad } from '../extension/AppComponents';
import { Color, Config, isNullOrEmpty } from '../extension/AppInit';
import * as Animatable from 'react-native-animatable';
import IoIcon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-community/async-storage';
import AccountInfoContext from '../context/AccountInfoContext';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@inject('settingStore')
@inject('securityStore')
@observer
class PinCode extends Component {
  constructor(props){
    super(props);
    this.state = {
      hidedot:true,
      enteredpin:"",
      shaking:false,
      firsttime:false,
      firsttimepin:"",
      retypefirsttime:false,
      retypefirsttimepin:"",
      userpincode:"",
      appState:"",
      startchangepincode:false,
      changingpin:"",
      retypechanging:false,
      retypechangingpin:""
    }
  }

  componentDidMount(){
    const {params} = this.props.navigation.state;
    console.log(params.isverify)
    if(Platform.OS === "android"  && params.isverify){
      BackHandler.addEventListener("hardwareBackPress", this.forceOpen);
    }
    this._checkPinCodeExist();
  }

  componentWillUnmount(){
    const {params} = this.props.navigation.state;
    if(Platform.OS === "android" && params.isverify){
      BackHandler.removeEventListener("hardwareBackPress", this.forceOpen);
    }
  }

  forceOpen = () =>{
    return true;
  }

  _checkPinCodeExist = async() =>{
    // const {pincode} = this.props.settingStore;
    // console.log(pincode);
    if(!isNullOrEmpty(this.props.settingStore.settings.security.pincode)){
      this.setState({
        userpincode:this.props.settingStore.settings.security.pincode
      });
    }else{
      this.setState({
        firsttime:true
      });
    }
    // try {
    //   const value = await AsyncStorage.getItem('@pincode');
    //   // console.log(value);
    //   if(value === null) {
    //     this.setState({
    //       firsttime:true
    //     },()=>{
    //       this.props.navigation.navigate("PinCode");
    //     });
    //   }else{
    //     this.setState({
    //       userpincode:value
    //     });
    //   }
    // } catch(e) {
    //   console.log(e)
    //   // error reading value
    // }
  }

  renderCodeDot(){
    var dots = [];
    for(var dot = 0; dot < 6; dot++){
      dots.push(
        <View key={dot} style={this.state.enteredpin.length >= (dot + 1) ? styles.dotfilled : styles.dotline}></View>
      )
    }
    return dots;
  }

  _EnteringValue = (pin) =>{
    Vibration.vibrate(100);
    if(this.state.enteredpin.length == 6) return;
    this.setState({
      enteredpin:this.state.enteredpin + pin
    },()=>{
      const {params} = this.props.navigation.state;
      if(params.changepincode){ // change pin
        if(!this.state.startchangepincode && this.state.enteredpin.length == 6){
          if(this.props.settingStore.settings.security.pincode == this.state.enteredpin){
            this.setState({
              startchangepincode:true,
              enteredpin:""
            })
          }else{
            this._Shaking();
          }
        }
        if(this.state.startchangepincode && this.state.enteredpin.length == 6){
          this.setState({
            startchangepincode:false,
            retypechanging:true,
            changingpin:this.state.enteredpin,
            enteredpin:""
          })
        }
        if(this.state.retypechanging && this.state.enteredpin.length == 6){
          if(this.state.enteredpin == this.state.changingpin){
            this.setState({
              retypechangingpin:this.state.enteredpin,
              enteredpin:""
            },()=>{
              let newpincode = {
                code:this.state.retypechangingpin,
                enable:true
              }
              this.props.settingStore.setPincode(newpincode);
              this._savePinCode();
            });
          }else{
            this._Shaking();
          }
        }
        
      }else{
        //normal check
        if(!isNullOrEmpty(this.state.userpincode) && this.state.enteredpin.length == 6){
          if(this.state.userpincode == this.state.enteredpin){
            this.setState({
              enteredpin:""
            },()=>{
              console.log("security check")
              if(this.props.securityStore.requestverify){
                let currentsteper = this.props.securityStore.selectedsecuritysteper - 1;
                this.props.securityStore.setTotalSecuritySteper(currentsteper);
                this.props.securityStore.updateSecurityCompState(true);
                if(currentsteper == 0){
                  this.props.securityStore.onProceedSuccess();
                  this.props.securityStore.setRequestVerify(false);
                }
                this.props.navigation.goBack();
              }
            })
          }else{
            this._Shaking();
          }
        }else{ //firsttime
          if(this.state.firsttime && this.state.enteredpin.length == 6){
            this.setState({
              firsttime:false,
              retypefirsttime:true,
              firsttimepin:this.state.enteredpin,
              enteredpin:""
            })
          }
          if(this.state.retypefirsttime && this.state.enteredpin.length == 6){
            if(this.state.enteredpin == this.state.firsttimepin){
              this.setState({
                retypefirsttime:false,
                retypefirsttimepin:this.state.enteredpin,
                enteredpin:""
              },()=>{
                let newpincode = {
                  code:this.state.retypefirsttimepin,
                  enable:true
                }
                this.props.settingStore.setPincode(newpincode);
                this._savePinCode();
              });
            }else{
              this._Shaking();
            }
          }
        }   
      }     
    })
  }

  _RemovingValue = () =>{
    this.setState({
      enteredpin:this.state.enteredpin.substring(0, this.state.enteredpin.length - 1)
    },()=>{
      console.log(this.state.enteredpin);
    })
  }

  _savePinCode = async() =>{
    try {
      const value = await AsyncStorage.getItem('@settings');
      // console.log(value)
      if(value !== null) {
        let allsettings = JSON.parse(value);
        let selectedsetting = allsettings.find(x => x.Id == this.props.settingStore.accinfo.Id);
        let indexsetting = allsettings.indexOf(selectedsetting);
        // allsettings[indexsetting].pincode.enable = true;
        allsettings[indexsetting].security.selected = "Pincode";
        allsettings[indexsetting].security.selectedlist = allsettings[indexsetting].security.selectedlist.concat("Pincode");
        allsettings[indexsetting].security.pincode = this.state.retypechanging ? this.state.retypechangingpin : this.state.retypefirsttimepin;
        await AsyncStorage.setItem('@settings', JSON.stringify(allsettings)).then(()=>{
          // console.log(JSON.stringify(allsettings));
          this.props.settingStore.setSettings(allsettings[indexsetting]);
          const {params} = this.props.navigation.state;
          params.refreshSecurity ? params.refreshSecurity() : null;
          this.props.navigation.goBack();
        });
      }
    } catch(e) {
      console.log(e)
      // error reading value
    }
    // try {
    //   await AsyncStorage.setItem('@pincode', this.state.retypechanging ? this.state.retypechangingpin : this.state.retypefirsttimepin).then(()=>{
    //     this.props.navigation.goBack();
    //   });
    // } catch (e) {
    //   // saving error
    // }
  }

  _Shaking = () => {
    this.setState({
      shaking:true,
      enteredpin:""
    },()=>{
      setTimeout(() => {
        this.setState({
          shaking:false
        });
      }, 2000);
    });
  }

  _renderPinTitle(){
    const {params} = this.props.navigation.state;
    if(this.state.firsttime || this.state.startchangepincode){
      return intl.get('Pincode.EnternewPinCode');
    }else if(this.state.retypefirsttime || this.state.retypechanging){
      return intl.get('Pincode.ConfirmnewPinCode');
    }else if(params.changepincode){
      return intl.get('Pincode.EntercurrentPincode');
    }else{
      return intl.get('Pincode.EnterPinCode');
    }
  }

  _renderPinHeader(){
    const {params} = this.props.navigation.state;
    if(params.isverify) return "";
    if(this.state.firsttime){
      return intl.get('Pincode.SETPINCODE');
    }else if(this.state.retypefirsttime){
      return "";
    }else if(!params.isfirsttime && !this.state.startchangepincode && !this.state.retypechanging){
      return intl.get('Pincode.CHANGEPINCODE');
    }else{
      return "";
    }
  }

  _onPinBack = (goingback) =>{
    // console.log(goingback)
    const {params} = this.props.navigation.state;
    if(params.isverify){
      console.log("back 0");
      this.props.securityStore.setTotalSecuritySteper(this.props.settingStore.settings.security.selectedlist.length);
    }
    if(params.isfirsttime && this.state.retypefirsttime && this.state.enteredpin.length != 6){
      this.setState({
        firsttimepin:"",
        retypefirsttimepin:"",
        enteredpin:"",
        firsttime:true,
        retypefirsttime:false
      });
      console.log("back 1");
      return false;
    }
    if(params.changepincode && !this.state.startchangepincode && !this.state.retypechanging && this.state.enteredpin.length != 6 && goingback){
      this.props.navigation.goBack();
      console.log("back 2");
      return false;
    }
    // console.log((this.state.startchangepincode && this.state.enteredpin.length != 6 ) || (this.state.retypechanging && this.state.enteredpin.length != 6 ) && goingback);
    if(params.changepincode && this.state.enteredpin.length != 6 && (this.state.startchangepincode || this.state.retypechanging)){
      this.setState({
        enteredpin:"",
        startchangepincode:false,
        retypechanging:false
      });
      console.log("back 3");
      return false;
    }
    if(!isNullOrEmpty(this.props.settingStore.settings.security.pincode) && !params.changepincode && !params.isverify){
      console.log("back 4");
      return true;
    }
    if(goingback){
      this.props.navigation.goBack();
      if(this.props.securityStore.requestverify){
        console.log("back 5");
        this.props.securityStore.setRequestVerify(false);
      }
      return false;
    }
    if(!params.isverify && goingback){
      this.props.navigation.goBack();
      console.log("back 99");
      return false;
    }
  }

  render() {
    const {params} = this.props.navigation.state;
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} isclosebtn={this.state.retypefirsttime || this.state.startchangepincode || this.state.retypechanging ? false : true} 
          noback={(!this.state.firsttime && !this.state.retypefirsttime) || params.changepincode || params.isfirsttime ? false : true} 
          title={this._renderPinHeader()}
          backfunc={()=> this._onPinBack(true)} />
          <View style={styles.innercontainer}>
            <Image source={require('../resources/logo.png')} style={styles.logopng} resizeMode="contain" />
            <Text style={styles.whiteheader}>{this._renderPinTitle()}</Text>
            <Animatable.View style={styles.dotparent} animation={this.state.shaking ? "shake" : null} useNativeDriver>
              {this.renderCodeDot()}
            </Animatable.View>
            <NumberPad {...this.props} hidedot onEnter={(value)=> this._EnteringValue(value)} onRemove={()=> this._RemovingValue()} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default PinCode;  

const styles = StyleSheet.create({
  logopng:{
    height:120,
    width:120,
    marginBottom:20,
    opacity:0.1
  },
  dotfilled:{
    height:12,
    width:12,
    borderRadius:100,
    borderWidth:1,
    borderColor:'#fff',
    backgroundColor:'#fff'
  },
  dotline:{
    height:12,
    width:12,
    borderRadius:100,
    borderWidth:1,
    borderColor:'#fff'
  },
  dotparent:{
    justifyContent:'space-evenly',
    alignItems:'center',
    alignContent:'center',
    flexDirection:'row',
    width:300,
    marginTop:40,
    marginBottom:40
  },
  whiteheader:{
    color:"#fff",
    fontWeight:'bold',
    fontSize:20
  },
  innercontainer:{
    justifyContent:'center',
    alignItems:'center',
    alignContent:'center',
    flex:1,
    // backgroundColor:'#ccc'
  },
  container: {
    flex: 1,
  }
});
