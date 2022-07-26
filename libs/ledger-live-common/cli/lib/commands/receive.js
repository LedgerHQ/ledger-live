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
var scan_1 = require("../scan");
var qr_1 = require("../qr");
var errors_1 = require("@ledgerhq/live-common/lib/errors");
exports["default"] = {
    description: "Receive crypto-assets (verify on device)",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "qr",
            type: Boolean,
            desc: "also display a QR Code"
        },
        {
            name: "freshAddressIndex",
            type: Number,
            desc: "Change fresh address index"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.concatMap)(function (account) {
            var _a;
            return (0, rxjs_1.concat)((0, rxjs_1.of)(opts.freshAddressIndex !== undefined &&
                opts.freshAddressIndex !== null
                ? (_a = account.freshAddresses[opts.freshAddressIndex]) === null || _a === void 0 ? void 0 : _a.address
                : account.freshAddress).pipe((0, operators_1.map)(function (address) {
                if (!address)
                    throw new errors_1.FreshAddressIndexInvalid();
                return address;
            })), opts.qr ? (0, qr_1.asQR)(account.freshAddress) : rxjs_1.EMPTY, (0, bridge_1.getAccountBridge)(account)
                .receive(account, {
                deviceId: opts.device || "",
                verify: true,
                freshAddressIndex: opts.freshAddressIndex
            })
                .pipe((0, operators_1.ignoreElements)()));
        }));
    }
};
//# sourceMappingURL=receive.js.map