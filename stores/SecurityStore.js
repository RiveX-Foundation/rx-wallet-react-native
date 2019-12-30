import { action, observable, toJS } from 'mobx';
import settingStore from './SettingStore';
var speakeasy = require("speakeasy");
var base32 = require('hi-base32');
class SecurityStore {
  @observable requestverify = false;
  @observable OTPType = "";
  @observable smsnotification = true;
  //OTP
  @observable receivedOTPCode = "";
  @observable receivedOTPJwToken = "";
  @observable enteredOTPCode = "";
  @observable onProceedSuccess = ()=> null;
  @observable onProceedError = ()=> null;
  //Google Auth 2FA
  @observable entered2FACode = "";
  @observable selectedsecuritysteper = 1;
  @observable securityCompState = false;
  
  @action generateGoogleAuthSecret(){
    var secret = speakeasy.generateSecret({length: 20});
    return secret;
  }

  @action setRequestVerify(status){
    this.requestverify = status;
  }

  @action setOTPType(type){
    this.OTPType = type;
  }

  @action checkSecurityTypeForSMS(type){
    type == "OneTimePassword" ? this.smsnotification = true : this.smsnotification = false;
    // this.smsnotification = false
  }

  @action setReceivedOTPCode(code,token){
    this.receivedOTPCode = code;
    this.receivedOTPJwToken = token
  }

  @action setEnteredOTPCode(code){
    this.enteredOTPCode = code;
  }

  @action checkOTPValid(){
    return (this.receivedOTPCode == this.enteredOTPCode) && this.enteredOTPCode != "";
  }

  @action setSecurityInit = (success,error) =>{
    this.onProceedSuccess = success;
    this.onProceedError = error;
  }

  @action resetEverythings(){
    this.requestverify = false;
    this.receivedOTPCode = "";
    this.receivedOTPJwToken = "";
    this.enteredOTPCode = "";
    this.onProceedSuccess = ()=> null;
    this.onProceedError = ()=> null;
    this.entered2FACode = "";
    this.securityCompState = false;
  }

  @action setEntered2FACode(code){
    this.entered2FACode = code;
  }

  @action check2FAValid(){
    const secretAscii = base32.decode(settingStore.accinfo.GoogleAuthKey);
    const secretHex = this._toHex(secretAscii);
    const authcode = speakeasy.totp({
      secret: secretHex,
      algorithm: 'sha1',
      encoding: 'hex'
    });
    console.log(authcode)
    return authcode == this.entered2FACode;
  }

  _toHex = (key) =>{
    return new Buffer(key, 'ascii').toString('hex');
  }

  @action setTotalSecuritySteper(total){
    this.selectedsecuritysteper = total;
  }

  @action isCurrentSecurityAction(action){
    var selectedsecuritylist_reverse = toJS(settingStore.settings.security.selectedlist).reverse();
    var selectedsecuritysteper = this.selectedsecuritysteper;
    var currentsecuritytype = selectedsecuritylist_reverse[selectedsecuritysteper - 1];
    // console.log(currentsecuritytype , action)
    return currentsecuritytype == action;
  }

  @action updateSecurityCompState(status){
    this.securityCompState = status;
  }
}
const securityStore = new SecurityStore();
export default securityStore;