import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Clipboard,
  Share,
  BackHandler,
  FlatList
} from 'react-native';
// import { QRCode } from 'react-native-custom-qr-codes';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader, NumberPad, BottomButton } from '../extension/AppComponents';
import { Color, Config, sendToast, isObjEmpty } from '../extension/AppInit';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import EnIcon from 'react-native-vector-icons/Entypo'
import AntIcon from 'react-native-vector-icons/AntDesign'
import * as Animatable from 'react-native-animatable';
import RiveIcon from '../extension/RiveIcon'
import { PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator } from 'rn-viewpager';
import Ripple from 'react-native-material-ripple';
import AccountInfoContext from '../context/AccountInfoContext'
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import FastImage from 'react-native-fast-image';
import IoIcon from 'react-native-vector-icons/Ionicons'

@inject('settingStore')
@observer
class ExportSeed extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedWallet: {},
      currentindex: 0,
      selectedToken: {}
    }
  }

  componentDidMount() {
    const { params } = this.props.navigation.state;
    this.setState({
      selectedWallet: params.selectedWallet
    });
  }

  componentWillUnmount() {
    const { params } = this.props.navigation.state;
    if (params.onBack) {
      params.onBack();
    }
  }


  renderItems({ item, index }) {
    return (
      <View style={styles.seeditem}>
        <Text style={styles.seeditemtt}>{`${item}`}</Text>
      </View>
    )
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} isclosebtn={true} title={intl.get('BasicWallet.YourMnemonicPhrase')} />
          {!isObjEmpty(this.state.selectedWallet) ?
            <View>
              <FlatList
                data={this.state.selectedWallet.seedphase.split(" ")}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderItems.bind(this)}
                contentContainerStyle={styles.recoveryseedbeforectn}
                numColumns={3}
              />
            </View>
            : null}
          {!isObjEmpty(this.state.selectedWallet) ?
            <View style={styles.bottomseed}>
              <Text style={styles.actionbtntt} onPress={() => this.props.settingStore.copytoclipboard(this.state.selectedWallet.seedphase)}>{intl.get('Common.COPY')}</Text>
            </View>
            : null}
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

export default ExportSeed;

const styles = StyleSheet.create({
  bottomseed: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    alignSelf: 'center',
    // justifyContent:'space-between'
    justifyContent: 'center',
    marginTop:50
  },
  actionbtntt: {
    color: Color.lightbluegreen,
    fontFamily: Config.regulartt
  },
  recoveryseedbeforectn: {
    alignItems: 'center',
    minHeight: 150
  },
  seeditemtt: {
    color: "#fff",
    fontFamily: Config.regulartt,
    // fontSize:12
    // textAlign:'center'
  },
  seeditem: {
    backgroundColor: "#343860",
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 12,
    minWidth: 100,
    maxWidth: 110,
    marginLeft: 5,
    marginRight: 5,
    alignItems: 'center'
  },
  recoveryseedbeforectnmain: {
    width: Config.winwidth - 40,
    alignSelf: 'center',
    marginTop: 40,
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
