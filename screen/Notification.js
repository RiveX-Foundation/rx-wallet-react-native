import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import intl from 'react-intl-universal';
// {
//   title:"Payment Proposal",
//   msg:"Payment request for your signature - Our Wallet 1",
//   dt:"1 min ago"
// },{
//   title:"Remove Wallet",
//   msg:"Request for your signature to remove wallet - Our Wallet 2",
//   dt:"30 min ago"
// },{
//   title:"Wallet Name Changed",
//   msg:"Sakana had renamed your Shared Wallet Our Wallet 3 to Our Wallet 4”",
//   dt:"1 day ago"
// }
export default class Notification extends Component {
  constructor(props){
    super(props);
    this.state = {
      notificationlist:[],
      fetchdone:false
    }
  }

  componentDidMount(){
    this.setState({
      fetchdone:true
    })
  }

  _renderNotification({item,index}){
    return(
      <View style={styles.notificationitem}>
        <Text style={styles.whitelabel}>{item.title}</Text>
        <Text style={styles.greytt}>{item.msg}</Text>
        <View style={{alignItems:'flex-end'}}>
          <Text style={styles.greytt}>{item.dt}</Text>
        </View>
      </View>
    )
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={intl.get('Common.Notification')} isclosebtn/>
          {this.state.notificationlist.length ==  0 ?
            <View style={styles.notrxctn}>
              {this.state.fetchdone ?
              <Text style={styles.notrxtt}>{intl.get('Common.NoNotification')}</Text>
              :
              <ActivityIndicator size={'small'} color={"#fff"} />
              }
            </View>
          : 
          <FlatList 
            data={this.state.notificationlist}
            keyExtractor={(item,index) => index.toString()}
            renderItem={this._renderNotification.bind(this)}
          />
          }
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  notrxtt:{
    color:"#fff",
    fontFamily:Config.regulartt
  },
  notrxctn:{
    justifyContent:'center',
    alignItems:'center',
    flexGrow:1,
    flexShrink:1
  },
  greytt:{
    color:Color.textgrey,
    fontFamily:Config.regulartt,
    fontSize:14
  },
  whitelabel:{
    color:'#fff',
    fontFamily:Config.regulartt,
    fontSize:14
  },
  notificationitem:{
    backgroundColor:Color.rowblue,
    marginHorizontal:20,
    marginBottom:10,
    padding:20,
    borderRadius:10
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
