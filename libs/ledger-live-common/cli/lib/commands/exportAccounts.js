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
var qrloop_1 = require("qrloop");
var cross_1 = require("@ledgerhq/live-common/lib/cross");
var qr_1 = require("../qr");
var scan_1 = require("../scan");
exports["default"] = {
    description: "Export given accounts to Live QR or console for importing",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "out",
            alias: "o",
            type: Boolean,
            desc: "output to console"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.reduce)(function (accounts, account) { return accounts.concat(account); }, []), (0, operators_1.mergeMap)(function (accounts) {
            var data = (0, cross_1.encode)({
                accounts: accounts,
                settings: {
                    pairExchanges: {},
                    currenciesSettings: {}
                },
                exporterName: "ledger-live-cli",
                exporterVersion: "0.0.0"
            });
            var frames = (0, qrloop_1.dataToFrames)(data, 80, 4);
            if (opts.out) {
                return (0, rxjs_1.of)(Buffer.from(JSON.stringify(frames)).toString("base64"));
            }
            else {
                var qrObservables_1 = frames.map(function (str) {
                    return (0, qr_1.asQR)(str).pipe((0, operators_1.shareReplay)());
                });
                return (0, rxjs_1.interval)(300).pipe((0, operators_1.mergeMap)(function (i) { return qrObservables_1[i % qrObservables_1.length]; }));
            }
        }), (0, operators_1.tap)(function () { return console.clear(); }) // eslint-disable-line no-console
        );
    }
};
//# sourceMappingURL=exportAccounts.js.map