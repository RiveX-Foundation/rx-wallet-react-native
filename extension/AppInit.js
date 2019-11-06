import {
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import axios from 'axios';
import {showMessage} from "react-native-flash-message";
import Toast from 'react-native-root-toast';
const Web3 = require('web3');
import { getStatusBarHeight } from 'react-native-status-bar-height';

export const Color = {
    // gradientColor:['#28286F', '#1A1E42', '#121929'],
    gradientColor:['#1C1F46', '#121928'],
    popupgradient:["#302e87","#121928"],
    deepblue:"#3834D8",
    rippleblueColor:"#5f5cdf",
    greyblue:"#272A51",
    textgrey:"#898C98",
    lightbluegreen:"#64F4F4",
    rowblue:"rgba(52,55,97,0.5)",
    traxwhite:"rgba(255,255,255,0.2)",
    basicColor:"#AE76FF",
    shareColor:"#FFCB80",
    hardwareColor:"#33FFBB", 
    importColor:"#FF9178", 
    basicGradient:["#27286D","#22245C","#1B1F46","#151C33"],
    noticeGradient:["#472841","#241b2f"],
    coinGradient:["#25294D","#202545","#1B203B","#141B2F"],
    // noticeGradient:["#482841","#3F253D","#372239","#2A1D33"],
    trxGradient:["transparent","transparent"]
};

export const Config = {
    endpoint:"http://rvxadmin.boxybanana.com/",
    winwidth:Dimensions.get('window').width,
    winheight:Dimensions.get('window').height,
    statusBarHeight:getStatusBarHeight(),
    availableHeight:Dimensions.get('window').height - getStatusBarHeight() - 50,
    linearGradient:{
        flex: 1,
        width:"100%",
        height:"100%",
        paddingTop:Platform.OS === 'android' ? getStatusBarHeight() : 0
      },
      imgbackground:{
        flex: 1,
        width:"100%",
        // height:Dimensions.get('window').height,
        paddingTop:getStatusBarHeight()
      },
    regulartt: Platform.OS === 'android' ? "NotoSans-Regular" : "NotoSans",
    // lighttt:Platform.OS === 'android' ? "NotoSansJP-Light" : "NotoSansJPLight",
    boldtt:Platform.OS === 'android' ? "NotoSans-Bold" : "NotoSans-Bold",
    authinputctn:{
      backgroundColor:Color.traxwhite,
      height:45,
      width:Dimensions.get('window').width * 0.8,
      borderRadius:30,
      marginBottom:15,
      maxWidth:400,
      flexDirection:'row',
      justifyContent:'space-between',
      alignItems:'center',
      borderWidth:2,
      borderColor:Color.traxwhite
    },
    authinput:{
      backgroundColor:Color.traxwhite,
      height:45,
      paddingHorizontal:20,
      width:Dimensions.get('window').width * 0.8,
      borderRadius:30,
      marginBottom:15,
      maxWidth:400,
      color:"#fff",
      fontFamily:Platform.OS === 'android' ? "NotoSans-Regular" : "NotoSans",
      fontSize:14,
      borderWidth:2,
      borderColor:Color.traxwhite
    },
    passinput:{
      // backgroundColor:Color.traxwhite,
      // backgroundColor:'#333',
      height:45,
      paddingHorizontal:20,
      width:'80%',
      maxWidth:400,
      color:"#fff",
      fontFamily:Platform.OS === 'android' ? "NotoSans-Regular" : "NotoSans",
      fontSize:14
    },
    visiblepassicon:{
      height:45,
      width:45,
      paddingRight:10,
      justifyContent:'center',
      alignItems:'center'
    },
    phoneinput:{
      backgroundColor:Color.traxwhite,
      height:45,
      paddingHorizontal:20,
      width:(Dimensions.get('window').width * 0.8) - 70,
      borderTopRightRadius:30,
      borderBottomRightRadius:30,
      maxWidth:330,
      color:"#fff",
      fontFamily:Platform.OS === 'android' ? "NotoSans-Regular" : "NotoSans",
      fontSize:14
    },
    otpitem:{
      width:(Dimensions.get('window').width - 80) / 6,
      height:(Dimensions.get('window').width - 80) / 6,
      backgroundColor:"rgba(255,255,255,0.2)",
      borderRadius:100,
      margin:2,
      textAlign:'center',
      color:"#fff",
    },
    countryinput:{
      backgroundColor:Color.traxwhite,
      height:45,
      justifyContent:'center',
      marginRight:3,
      borderTopLeftRadius:30,
      borderBottomLeftRadius:30,
      width:70,
      justifyContent:'center',
      alignItems:'center'
    },
    inputerror:{
      borderWidth:2,
      borderColor:"#fc4c4c"
    }
}

export const DevivationPath = {
  ETH:"m/44'/60'/0'/0/",
  WAN: "m/44'/5718350'/0'/0/"
}

export const SensitiveInfo = {
  // cryptobalanceurl : "https://api.tokenbalance.com/token/{tokencontract}/{ethaddr}",
  // tokencontract : "0x221535cbced4c264e53373d81b73c29d010832a5", //XMOO CONTRACDT
  etherscanAPIKey : "Z92QFIY7SR8XYJQWHEIRVPNG92VZ274YS4",
  // web3Provider : "https://mainnet.infura.io:443",
  // chainid : 0x01
}


export const isNullOrEmpty = (value) => {
    return (value == null || value == "") ? true : false;
}

export const numberFormatter = (value) => {
    var part1 = value.substring(0, 3);
    var part2 = value.substring(3, 6);
    var part3 = value.substring(6, 10);
    var part4 = value.substring(10, value.length);
    return `${part1} ${part2} ${part3} ${part4}`;
}

export const numberWithCommas = (x,fixed) =>{
    return fixed? x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const shuffle = (arr) =>{
  var i,
      j,
      temp;
  for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
  }
  // cb(arr);    
  return arr;
};

export const callApi = (path,formdata,cb,cberror) =>{
  console.log(`${Config.endpoint + path}`)
  axios({
    method: 'post',
    url: `${Config.endpoint + path}`,
    data: formdata,
    config: { headers: {'Content-Type': 'multipart/form-data' }}
  })
  .then((response) =>{
    // console.log(response);
      cb(response.data);
  })
  .catch((response) =>{
      //handle error
      // console.log(JSON.stringify(response));
      cberror(response);
  });
}

export const validateEmail = (email) =>{
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export const sendToast = (msg) =>{
  Toast.show(msg,{
    backgroundColor:"#F0F0F0",
    position:-50,
    containerStyle: {
      borderRadius: 30,
      paddingHorizontal:12,
      paddingVertical:8
    },
    textStyle:{
      fontFamily:Config.regulartt,
      color:"#000",
      fontSize:12
    }
  });
}

export const convertHexToDecimal = function(val) {
  var hex = val;
  hex = hex.replace("0x","");
  hex = hex.replace("0X","");
  var x;
  try {
    x = new Web3.utils.BN(hex, 16);
  }
  catch(err) {
    return 0;
  }
  var xx=x.toString(10);
  return xx;
}

export const sumObjectValue = (items, prop) =>{
  return items.reduce((a, b) => {
      return a + b[prop];
  }, 0);
};

export const checkCryptographic = (pwd) =>{
  let reg = new RegExp("(?=^[^\\s]*$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[\\S]{6,}");

  return reg.test(pwd);
}

export const toFixedNoRounding = (str,n) =>{
  // const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
  // const a = str.toString().match(reg)[0];
  // const dot = a.indexOf(".");
  // if (dot === -1) { // integer, insert decimal dot and pad up zeros
  //     return a + "." + "0".repeat(n);
  // }
  // const b = n - (a.length - dot) + 1;
  // return b > 0 ? (a + "0".repeat(b)) : a;
  return str.toFixed(n);
}

export const isObjEmpty = (obj) =>{
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}