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
var transaction_1 = require("@ledgerhq/live-common/lib/transaction");
var scan_1 = require("../scan");
var transaction_2 = require("../transaction");
var getTransactionStatusFormatters = {
    "default": function (_a) {
        var status = _a.status, transaction = _a.transaction, account = _a.account;
        return "TRANSACTION " +
            ((0, transaction_1.formatTransaction)(transaction, account) ||
                JSON.stringify((0, transaction_1.toTransactionRaw)(transaction))) +
            "\n" +
            "STATUS " +
            (0, transaction_1.formatTransactionStatus)(transaction, status, account);
    },
    json: function (_a) {
        var status = _a.status, transaction = _a.transaction;
        return "TRANSACTION " +
            JSON.stringify((0, transaction_1.toTransactionRaw)(transaction)) +
            "\n" +
            "STATUS " +
            JSON.stringify((0, transaction_1.toTransactionStatusRaw)(status));
    }
};
exports["default"] = {
    description: "Prepare a transaction and returns 'TransactionStatus' meta information",
    args: __spreadArray(__spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), __read(transaction_2.inferTransactionsOpts), false), [
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(getTransactionStatusFormatters).join(" | "),
            desc: "how to display the data"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.concatMap)(function (account) {
            return (0, rxjs_1.from)((0, transaction_2.inferTransactions)(account, opts)).pipe((0, operators_1.mergeMap)(function (inferred) {
                return inferred.reduce(function (acc, _a) {
                    var _b = __read(_a, 2), transaction = _b[0], status = _b[1];
                    return (0, rxjs_1.concat)(acc, (0, rxjs_1.of)({
                        transaction: transaction,
                        status: status,
                        account: account
                    }));
                }, rxjs_1.EMPTY);
            }), (0, operators_1.map)(function (e) {
                var f = getTransactionStatusFormatters[opts.format || "default"];
                if (!f) {
                    throw new Error("getTransactionStatusFormatters: no such formatter '" +
                        opts.format +
                        "'");
                }
                return f(e);
            }));
        }));
    }
};
//# sourceMappingURL=getTransactionStatus.js.map