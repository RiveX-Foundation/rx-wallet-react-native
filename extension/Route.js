import React, {Component} from 'react';
import Login from '../screen/Login'
import Home from '../screen/Home'
import CreateAccount from '../screen/CreateAccount'
import ResetPassword from '../screen/ResetPassword'
import NewWallet from '../screen/NewWallet'
import BasicWallet from '../screen/BasicWallet'
import SharedWallet from '../screen/SharedWallet'
import Settings from '../screen/Settings'
import ManageWallet from '../screen/ManageWallet'
import ImportWallet from '../screen/ImportWallet'
import PinCode from '../screen/PinCode'
import Receive from '../screen/Receive'
import Send from '../screen/Send'
import Stacking from '../screen/Stacking'
import Transactions from '../screen/Transactions'
import TransactionDetail from '../screen/TransactionDetail'
import QRScanner from '../screen/QRScanner'
import ExportKey from '../screen/ExportKey'
import Notification from '../screen/Notification'
import WalletInvitation from '../screen/WalletInvitation'
import PersonalProfile from '../screen/PersonalProfile'
import EasyContent from '../screen/EasyContent'
import Offline from '../screen/Offline'
import Security from '../screen/Security'
import GoogleAuth from '../screen/GoogleAuth'
import NewTokenAsset from '../screen/NewTokenAsset'

import { createStackNavigator, createAppContainer, createSwitchNavigator } from 'react-navigation';
import { fromLeft, zoomIn, fadeIn, fromRight } from 'react-navigation-transitions';
import AccountInfoContext from '../context/AccountInfoContext'

const handleCustomTransition = ({ scenes }) => {
    const prevScene = scenes[scenes.length - 2];
    const nextScene = scenes[scenes.length - 1];
    if (prevScene
        && prevScene.route.routeName === 'Home'
        && nextScene.route.routeName === 'Settings') {
        return fromLeft();
    }
    if (prevScene
        && prevScene.route.routeName === 'Home'
        && nextScene.route.routeName === 'ManageWallet') {
        return fromRight();
    }
    if (prevScene
        && prevScene.route.routeName === 'Send'
        && nextScene.route.routeName === 'QRScanner') {
        return zoomIn();
    }
    if (prevScene
        && prevScene.route.routeName === 'ImportWallet'
        && nextScene.route.routeName === 'QRScanner') {
        return zoomIn();
    }
    if (prevScene
        && prevScene.route.routeName === 'SharedWallet'
        && nextScene.route.routeName === 'QRScanner') {
        return zoomIn();
    }
    if(nextScene.route.routeName === 'PinCode'){
        return fadeIn();
    }
    // console.log(prevScene,nextScene)
}

export const AppNavigator = createStackNavigator({
    Home:Home,
    NewWallet:NewWallet,
    BasicWallet:BasicWallet,
    Settings:Settings,
    ManageWallet:ManageWallet,
    ImportWallet:ImportWallet,
    PinCode:PinCode,
    Receive:Receive,
    Send:Send,
    Stacking:Stacking,
    Transactions:Transactions,
    TransactionDetail:TransactionDetail,
    QRScanner:QRScanner,
    ExportKey:ExportKey,
    Notification:Notification,
    SharedWallet:SharedWallet,
    WalletInvitation:WalletInvitation,
    PersonalProfile:PersonalProfile,
    EasyContent:EasyContent,
    Offline:Offline,
    Security:Security,
    GoogleAuth:GoogleAuth,
    NewTokenAsset:NewTokenAsset
},{
    initialRouteName:"Home",
    transitionConfig: (nav) => handleCustomTransition(nav),
    defaultNavigationOptions: {
        header:null
    },
    cardStyle: {
        // opacity: 1,
        backgroundColor: '#1C1F46',
    },
});

export const AuthNavigator = createStackNavigator({
    Login:Login,
    CreateAccount:CreateAccount,
    ResetPassword:ResetPassword
},{
    initialRouteName:"Login",
    defaultNavigationOptions: {
        header:null
    }
});

export const SwitchNavigator = createSwitchNavigator(
    {
        App: AppNavigator,
        Auth: AuthNavigator,
    },
    {
        initialRouteName: 'Auth',
    }
)

export const AppContainer = createAppContainer(SwitchNavigator);