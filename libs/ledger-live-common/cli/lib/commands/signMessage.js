"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var derivation_1 = require("@ledgerhq/live-common/lib/derivation");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var signMessage_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/signMessage"));
var scan_1 = require("../scan");
exports["default"] = {
    description: "Sign a message with the device on specific derivations (advanced)",
    args: [
        scan_1.currencyOpt,
        {
            name: "path",
            type: String,
            desc: "HDD derivation path"
        },
        {
            name: "derivationMode",
            type: String,
            desc: "derivationMode to use"
        },
        {
            name: "message",
            type: String,
            desc: "the message to sign"
        },
    ],
    job: function (arg) {
        return (0, scan_1.inferCurrency)(arg).pipe((0, operators_1.mergeMap)(function (currency) {
            if (!currency) {
                throw new Error("no currency provided");
            }
            if (!arg.path) {
                throw new Error("--path is required");
            }
            (0, derivation_1.asDerivationMode)(arg.derivationMode);
            return (0, deviceAccess_1.withDevice)(arg.device || "")(function (t) {
                return (0, rxjs_1.from)((0, signMessage_1["default"])(t, __assign(__assign({}, arg), { currency: currency })));
            });
        }));
    }
};
//# sourceMappingURL=signMessage.js.map