import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Image,
  ImageBackground
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config, isObjEmpty } from '../extension/AppInit';
import { RNCamera } from 'react-native-camera';
import MaIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { TouchableOpacity } from 'react-native-gesture-handler';
import BarcodeMask from 'react-native-barcode-mask';

export default class QRScanner extends Component {
  constructor(props){
    super(props);
    this.state = {
      onmount:false,
      onflash:false,
      isScandone:false,
      scannedresult:""
    }
  }

  componentDidMount(){
    setTimeout(() => {
      this.setState({onmount:true});
    }, 500);
  }

  componentWillUnmount(){
    this.props.navigation.state.params.onUnmount();
  }

  _openFlashLight = () =>{
    this.setState({
      onflash:!this.state.onflash
    })
  }

  _goBackResult = () =>{
    const { navigation } = this.props;
    navigation.goBack();
    navigation.state.params.onScanQR(this.state.scannedresult);
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        {this.state.onmount ?
        <RNCamera
            ref={ref => {
              this.camera = ref;
            }}
            style={styles.preview}
            flashMode={this.state.onflash ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
            type={RNCamera.Constants.Type.back}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            // ratio={"1:1"}
            onGoogleVisionBarcodesDetected={({ barcodes }) => {
              console.log(barcodes);
              let code = barcodes[0];
              if(!this.state.isScandone && code.type == "QR_CODE"){
                this.setState({
                  isScandone:true,
                  scannedresult:code.data.replace("ethereum:","")
                },()=>{
                  this._goBackResult();
                });
              }
            }}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
            onBarCodeRead={(barcodes)=>{
              if(!isObjEmpty(barcodes)){
                let code = barcodes;
                if(!this.state.isScandone && code.type == "org.iso.QRCode"){
                  console.log(barcodes);
                  this.setState({
                    isScandone:true,
                    scannedresult:code.data.replace("ethereum:","")
                  },()=>{
                    this._goBackResult();
                  });
                }
              }
            }}
          >
            <BarcodeMask transparency={0.4} showAnimatedLine={false} edgeBorderWidth={2} width={250} height={250} />
            <TopHeader {...this.props} title={"QRCode Scanner"} />
            <MaIcon name={this.state.onflash ? "flash" : "flash-off"} color={"#fff"} style={styles.flashicon}
              size={25} onPress={()=> this._openFlashLight()} />
            {/* <View style={styles.qrinner}>
              <Image source={require('../resources/QR_frame.png')} style={styles.framimg} />
            </View> */}
        </RNCamera>
        : null }
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  imgbg:{
    height:Config.winheight,
    width:Config.winwidth,
  },
  framimg:{
    width:250,
    height:250
  },
  qrinner:{
    flex:1,
    // backgroundColor:"#000",
    justifyContent:"center",
    alignItems:"center",
    marginTop:-75
  },
  flashicon:{
    position:'absolute',
    top:Config.statusBarHeight,
    right:0,
    // backgroundColor:'#ccc',
    paddingVertical:9,
    paddingHorizontal:15
  },
  centerlize:{
    alignContent:"center",
    justifyContent:"center",
    alignItems:"center"
  },
  preview: {
    height:Config.winheight,
    width:Config.winwidth,
    paddingTop:Config.statusBarHeight,
    backgroundColor:"rgba(0,0,0,0.5)"
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  }
});
