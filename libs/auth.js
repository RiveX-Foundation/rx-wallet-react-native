const Crypto = require("crypto");

const _secret = "af6f18eed9d3e8a4ddb73e7a736ca9cec9a49de7e7961c9269ffd4682b61a891";

function genSignature(_msg) {
    return Crypto.createHmac("sha256", _secret).update(_msg).digest("base64");//_encoding);
}

function isJSON(obj) {
    let yes = false;

    try {
        JSON.parse(JSON.stringify(obj));
        yes = true;
    } catch (err) {
        yes = false;
    }

    return yes;
}

function checkFormat(obj) {
    let expectKeys = ["jsonrpc", "method", "params", "id"];
    let result = {error:{}};
    let failed = false;

    let actualKeys = Object.keys(obj);
    expectKeys.forEach((k) => {
        if (0 > actualKeys.indexOf(k)) {
            result["error"][k] = "key parameter missing";
            failed = true;
        }
    });
    actualKeys.forEach((k) => {
        if (0 > expectKeys.indexOf(k)) {
            result["error"][k] = "key parameter redundant";
            failed = true;
        }
    });

    if (!failed) {
        delete result["error"];
    }
    return result;
}

function integrateJSON(obj) {
    let result = {}
    let newObj = Object.assign({}, obj);
    let check = checkFormat(newObj);
    if (isJSON(newObj)) {
        if (!check["error"]) {
            newObj["params"]["timestamp"] = Date.now();
            newObj["params"]["signature"] = genSignature(JSON.stringify(newObj));
            result["result"] = newObj;
        } else {
            result["error"] = check["error"];
        }
    } else {
        result["error"] = "the input params <obj> is not JSON object";
    }
    return result;
}

exports.integrateJSON = integrateJSON;
