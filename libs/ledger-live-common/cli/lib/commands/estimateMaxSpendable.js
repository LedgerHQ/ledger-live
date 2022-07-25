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
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var scan_1 = require("../scan");
var format = function (account, value) {
    var unit = (0, account_1.getAccountUnit)(account);
    var name = (0, account_1.getAccountName)(account);
    var amount = (0, currencies_1.formatCurrencyUnit)(unit, value, {
        showCode: true,
        disableRounding: true
    });
    return "".concat(name, ": ").concat(amount);
};
exports["default"] = {
    description: "estimate the max spendable of an account",
    args: __spreadArray([], __read(scan_1.scanCommonOpts), false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.concatMap)(function (account) {
            var bridge = (0, bridge_1.getAccountBridge)(account);
            return rxjs_1.concat.apply(void 0, __spreadArray([(0, rxjs_1.from)(bridge
                    .estimateMaxSpendable({
                    account: account,
                    parentAccount: null
                })
                    .then(function (maxSpendable) { return format(account, maxSpendable); }))], __read((account.subAccounts || []).map(function (subAccount) {
                return (0, rxjs_1.from)(bridge
                    .estimateMaxSpendable({
                    account: subAccount,
                    parentAccount: account
                })
                    .then(function (maxSpendable) { return "  " + format(subAccount, maxSpendable); }));
            })), false));
        }));
    }
};
//# sourceMappingURL=estimateMaxSpendable.js.map