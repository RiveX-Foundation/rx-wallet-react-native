import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet,
  Text,
  View,
  SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TransBar, TopHeader } from '../extension/AppComponents';
import { Color, Config } from '../extension/AppInit';
import {PagerTabIndicator, IndicatorViewPager, PagerTitleIndicator, PagerDotIndicator} from 'rn-viewpager';

export default class Stacking extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentindex:0
    }
  }

  _onchangeSelectedIndex = (response) =>{
    let index = response.position;
    this.setState({
      currentindex:index
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TransBar />
        <LinearGradient colors={Color.gradientColor} style={Config.linearGradient}>
          <TopHeader {...this.props} title={"STACKING"} isclosebtn/>  
          <IndicatorViewPager ref={(r) => this.newwallettab = r} style={styles.container} onPageSelected={(response)=> this._onchangeSelectedIndex(response)}>
            <View style={[styles.indicatorChild,styles.aligncenter]}>
              <Text style={styles.fakett}>Comming Soon</Text>
            </View>
          </IndicatorViewPager>
        </LinearGradient>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  fakett:{
    fontSize:20,
    fontFamily:Config.boldtt,
    textAlign:'center',
    color:'#fff'
  },
  aligncenter:{
    justifyContent:'center',
    alignItems:'center'
  },
  indicatorChild:{
    flex:1
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#fff',
  }
});
