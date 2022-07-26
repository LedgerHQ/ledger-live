"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var account_1 = require("@ledgerhq/live-common/lib/account");
var scan_1 = require("../scan");
var signedOperation_1 = require("../signedOperation");
exports["default"] = {
    description: "Broadcast signed operation(s)",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), __read(signedOperation_1.inferSignedOperationsOpts), false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.concatMap)(function (account) {
            return (0, signedOperation_1.inferSignedOperations)(account, opts).pipe((0, operators_1.concatMap)(function (signedOperation) {
                return (0, rxjs_1.from)((0, bridge_1.getAccountBridge)(account).broadcast({
                    account: account,
                    signedOperation: signedOperation
                }));
            }));
        }), (0, operators_1.map)(function (obj) { return JSON.stringify((0, account_1.toOperationRaw)(obj)); }));
    }
};
//# sourceMappingURL=broadcast.js.map