import React from 'react';
import { View } from 'react-native'

const initialState = {
    accinfo:{},
    acctoken:"",
    // settings:{},
    // walletlist:[],
    // reloadWallet:()=> null,
    // pincode:{
    //     code:"",
    //     enable:false
    // }
}

const context = React.createContext({
    acconfo: {},
    acctoken:"",
    settings:{},
    // walletlist:[],
    // reloadWallet:()=> null,
    // pincode:{
    //     code:"",
    //     enable:false
    // }
});
const withConsumer = (Component) => {
    return class extends React.Component {
        render() {
            return (
                <context.Consumer>
                    {
                        (AccountInfoContext) => (<Component AccountInfoContext={AccountInfoContext} {...this.props} />)
                    }
                </context.Consumer>
            )
        }
    };
}

const withProvider = (Component) => {
    return class extends React.Component {
        state = {
            accinfo: initialState.accinfo,
            acctoken:initialState.acctoken,
            // settings: initialState.settings,
            // walletlist:initialState.walletlist,
            // reloadWallet:initialState.reloadWallet,
            // pincode:{
            //     code:"",
            //     enable:false
            // },
            setAccinfo: (accinfo) => { this.setState({ accinfo }) },
            // setSettings: (settings) => { this.setState({ settings }) },
            // setWallets: (walletlist) => { this.setState({ walletlist }) },
            // setReloadWallet:(reloadWallet) => { this.setState({ reloadWallet }) },
            // setPincode:(pincode) => { this.setState({ pincode }) },
            setAccToken:(acctoken) => { this.setState({ acctoken }) }
        }
        render() {
            return (
                <context.Provider value={this.state}>
                    <Component />
                </context.Provider>
            )
        }
    };
}


export default {
    Context: context,
    Consumer: context.Consumer,
    Provider: context.Provider,
    withConsumer,
    withProvider
} 
