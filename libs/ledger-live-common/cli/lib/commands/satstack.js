"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = __importDefault(require("fs"));
var invariant_1 = __importDefault(require("invariant"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var env_1 = require("@ledgerhq/live-common/lib/env");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var descriptor_1 = require("@ledgerhq/live-common/lib/families/bitcoin/descriptor");
var satstack_1 = require("@ledgerhq/live-common/lib/families/bitcoin/satstack");
var scan_1 = require("../scan");
var stream_1 = require("../stream");
var bitcoin = (0, currencies_1.getCryptoCurrencyById)("bitcoin");
function requiredNodeConfig(nodeConfig) {
    (0, invariant_1["default"])(nodeConfig, "--rpcHOST,--rpcUSER,--rpcPASSWORD config required");
    var errors = (0, satstack_1.validateRPCNodeConfig)(nodeConfig);
    if (errors.length) {
        throw new Error(errors.map(function (e) { return e.field + ": " + e.error.message; }).join(", "));
    }
    return nodeConfig;
}
exports["default"] = {
    description: "SatStack: Generate and manage lss.json file",
    args: [
        scan_1.deviceOpt,
        {
            name: "no-device",
            type: Boolean,
            desc: "disable the scanning of device descriptors"
        },
        {
            name: "no-save",
            type: Boolean,
            desc: "disable the save of the lss file"
        },
        {
            name: "lss",
            type: String,
            typeDesc: "filename",
            desc: "A file to save the sats stack state"
        },
        {
            name: "rpcHOST",
            type: String,
            desc: "host to rpc full node (e.g. 127.0.0.1:8332)"
        },
        {
            name: "rpcUSER",
            type: String,
            desc: "username of full node"
        },
        {
            name: "rpcPASSWORD",
            type: String,
            desc: "password of full node"
        },
        {
            name: "rpcTLS",
            type: Boolean,
            desc: "use tls in full node"
        },
    ],
    job: function (_a) {
        var noDevice = _a["no-device"], noSave = _a["no-save"], device = _a.device, lss = _a.lss, rpcHOST = _a.rpcHOST, rpcUSER = _a.rpcUSER, rpcPASSWORD = _a.rpcPASSWORD, rpcTLS = _a.rpcTLS;
        (0, env_1.setEnv)("SATSTACK", true);
        var maybeExistingConfigO = !lss
            ? (0, rxjs_1.of)(null)
            : (0, stream_1.jsonFromFile)(lss, true).pipe((0, operators_1.map)(satstack_1.parseSatStackConfig), (0, operators_1.first)(), (0, operators_1.catchError)(function () { return (0, rxjs_1.of)(null); }));
        var maybeDescriptorsO = noDevice
            ? (0, rxjs_1.of)([])
            : (0, descriptor_1.scanDescriptors)(device || "", bitcoin).pipe((0, operators_1.reduce)(function (acc, item) { return acc.concat(item); }, []));
        var maybeNodeConfigOverride = rpcHOST
            ? requiredNodeConfig({
                host: rpcHOST,
                username: rpcUSER,
                password: rpcPASSWORD,
                tls: !!rpcTLS
            })
            : null;
        return (0, rxjs_1.forkJoin)({
            initialConfig: maybeExistingConfigO,
            descriptors: maybeDescriptorsO,
            checkedRPCNodeConfig: maybeNodeConfigOverride
                ? (0, rxjs_1.from)((0, satstack_1.checkRPCNodeConfig)(maybeNodeConfigOverride))
                : (0, rxjs_1.of)(null)
        }).pipe((0, operators_1.map)(function (a) {
            var initialConfig = a.initialConfig, descriptors = a.descriptors;
            var patch = {
                node: requiredNodeConfig(maybeNodeConfigOverride ||
                    (initialConfig ? initialConfig.node : null)),
                accounts: descriptors.map(function (descriptor) { return ({
                    descriptor: descriptor
                }); })
            };
            var config = initialConfig
                ? (0, satstack_1.editSatStackConfig)(initialConfig, patch)
                : patch;
            var str = (0, satstack_1.stringifySatStackConfig)(config);
            if (lss && !noSave) {
                fs_1["default"].writeFileSync(lss, str);
                return lss + " saved!";
            }
            return str;
        }));
    }
};
//# sourceMappingURL=satstack.js.map