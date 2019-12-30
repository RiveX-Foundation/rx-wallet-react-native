export const ethnetwork = [{
	"name": "MAINNET",
	"shortcode": "mainnet",
	"chainid": "0x01",
	"etherscanendpoint": "http://api.etherscan.io/api",
	"infuraendpoint": "https://mainnet.infura.io:443",
	"active":true,
	"color":"#ffffff",
	"type":"ethnetwork"
}, {
	"name": "RINKEBY",
	"shortcode": "rinkeby",
	"chainid": "0x04",
	"etherscanendpoint": "https://api-rinkeby.etherscan.io/api",
	"infuraendpoint": "https://rinkeby.infura.io:443",
	"active":true,
	"color": "#f6c343",
	"type":"ethnetwork"
}, {
	"name": "ROPSTEN",
	"shortcode": "ropsten",
	"chainid": "0x03",
	"etherscanendpoint": "https://api-ropsten.etherscan.io/api",
	"infuraendpoint": "https://ropsten.infura.io:443",
	"active":true,
	"color": "#ff4a8d",
	"type":"ethnetwork"
}, {
	"name": "KOVAN",
	"shortcode": "kovan",
	"chainid": "0x2a",
	"etherscanendpoint": "https://api-kovan.etherscan.io/api",
	"infuraendpoint": "https://kovan.infura.io:443",
	"active":true,
	"color":"#7057ff",
	"type":"ethnetwork"
}]

export const wannetwork = [{
	"name": "MAINNET",
	"shortcode": "wan_mainnet",
	"chainid": "0x01",
	"wsendpoint": "api.wanchain.org",
	"wsport":8443,
	"active":true,
	"iwankey":"40b9ac0a63a96d627363fb8f134d02d7e0cbe8e1785151b7b56bf5ee392d32ee",
	"iwansecret":"af6f18eed9d3e8a4ddb73e7a736ca9cec9a49de7e7961c9269ffd4682b61a891",
	"color":"#ffffff",
	"type":"wannetwork"
}, {
	"name": "TESTNET",
	"shortcode": "wan_testnet",
	"chainid": "0x03",
	"wsendpoint": "apitest.wanchain.org",
	"wsport":8443,
	"active":true,
	"iwankey":"40b9ac0a63a96d627363fb8f134d02d7e0cbe8e1785151b7b56bf5ee392d32ee",
	"iwansecret":"af6f18eed9d3e8a4ddb73e7a736ca9cec9a49de7e7961c9269ffd4682b61a891",
	"color": "#f6c343",
	"type":"wannetwork"
}]

export const networkList = wannetwork.concat(ethnetwork);