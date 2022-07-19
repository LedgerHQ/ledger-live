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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var fs_1 = __importDefault(require("fs"));
var scan_1 = require("../scan");
var serialization_1 = require("@ledgerhq/live-common/lib/account/serialization");
exports["default"] = {
    description: "utility for Ledger Live app.json file",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "appjson",
            type: String,
            typeDesc: "filename",
            desc: "path to a live desktop app.json"
        },
        {
            name: "add",
            alias: "a",
            type: Boolean,
            desc: "add accounts to live data"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.reduce)(function (accounts, account) { return accounts.concat(account); }, []), (0, operators_1.mergeMap)(function (accounts) {
            var appjsondata = opts.appjson
                ? JSON.parse(fs_1["default"].readFileSync(opts.appjson, "utf-8"))
                : {
                    data: {
                        accounts: []
                    }
                };
            if (typeof appjsondata.data.accounts === "string") {
                return (0, rxjs_1.throwError)(new Error("encrypted ledger live data is not supported"));
            }
            var existingIds = appjsondata.data.accounts.map(function (a) { return a.data.id; });
            var append = accounts
                .filter(function (a) { return !existingIds.includes(a.id); })
                .map(function (account) { return ({
                data: (0, serialization_1.toAccountRaw)(account),
                version: 1
            }); });
            appjsondata.data.accounts = appjsondata.data.accounts.concat(append);
            if (opts.appjson) {
                fs_1["default"].writeFileSync(opts.appjson, JSON.stringify(appjsondata), "utf-8");
                return (0, rxjs_1.of)(append.length + " accounts added.");
            }
            else {
                return (0, rxjs_1.of)(JSON.stringify(appjsondata));
            }
        }));
    }
};
//# sourceMappingURL=liveData.js.map