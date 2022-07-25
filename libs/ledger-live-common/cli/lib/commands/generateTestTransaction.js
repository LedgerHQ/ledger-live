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
var bignumber_js_1 = require("bignumber.js");
var account_1 = require("@ledgerhq/live-common/lib/account");
var transaction_1 = require("@ledgerhq/live-common/lib/transaction");
var logs_1 = require("@ledgerhq/logs");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var scan_1 = require("../scan");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var transaction_2 = require("../transaction");
var toJS = function (obj) {
    if (typeof obj === "object" && obj) {
        if (Array.isArray(obj)) {
            return "[" + obj.map(function (o) { return toJS(o); }).join(", ") + "]";
        }
        if (obj instanceof Error) {
            return "new ".concat(obj.name || "Error", "()");
        }
        if (bignumber_js_1.BigNumber.isBigNumber(obj)) {
            return "BigNumber(\"".concat(obj.toFixed(), "\")");
        }
        var keys = Object.keys(obj);
        if (keys.length === 0)
            return "{}";
        return ("{\n" +
            keys
                .map(function (key) {
                return "  ".concat(key, ": ").concat(toJS(obj[key]));
            })
                .join(",\n") +
            "\n}");
    }
    if (typeof obj === "string")
        return "\"".concat(obj, "\"");
    return String(obj);
};
var toTransactionStatusJS = function (status) { return toJS(status); };
exports["default"] = {
    description: "Generate a test for transaction (live-common dataset)",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), __read(transaction_2.inferTransactionsOpts), false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.switchMap)(function (account) {
            return (0, rxjs_1.from)((0, transaction_2.inferTransactions)(account, opts)).pipe((0, operators_1.concatMap)(function (inferred) {
                return inferred.reduce(function (acc, _a) {
                    var _b = __read(_a, 1), t = _b[0];
                    return (0, rxjs_1.concat)(acc, (0, rxjs_1.from)((0, rxjs_1.defer)(function () {
                        var apdus = [];
                        var unsubscribe = (0, logs_1.listen)(function (log) {
                            if (log.type === "apdu" && log.message) {
                                apdus.push(log.message);
                            }
                        });
                        var bridge = (0, bridge_1.getAccountBridge)(account);
                        return bridge
                            .signOperation({
                            account: account,
                            transaction: t,
                            deviceId: opts.device || ""
                        })
                            .pipe((0, operators_1.filter)(function (e) { return e.type === "signed"; }), (0, operators_1.map)(function (e) {
                            // FIXME: will always be true because of filter above
                            // but ts can't infer the right type for SignOperationEvent
                            if (e.type === "signed") {
                                return e.signedOperation;
                            }
                        }), (0, operators_1.concatMap)(function (signedOperation) {
                            return (0, rxjs_1.from)(bridge
                                .getTransactionStatus(account, t)
                                .then(function (s) { return [signedOperation, s]; }));
                        }), (0, operators_1.map)(function (_a) {
                            var _b = __read(_a, 2), signedOperation = _b[0], status = _b[1];
                            unsubscribe();
                            return "\n{\n  name: \"NO_NAME\",\n  transaction: fromTransactionRaw(".concat(JSON.stringify((0, transaction_1.toTransactionRaw)(t)), "),\n  expectedStatus: (account, transaction) => (\n    // you can use account and transaction for smart logic. drop the =>fn otherwise\n    ").concat(toTransactionStatusJS(status), "\n  ),\n  // WARNING: DO NOT commit this test publicly unless you're ok with possibility tx could leak out. (do self txs)\n  testSignedOperation: (expect, signedOperation) => {\n    expect(toSignedOperationRaw(signedOperation)).toMatchObject(").concat(JSON.stringify((0, transaction_1.toSignedOperationRaw)(signedOperation)), ")\n  },\n  apdus: `\n").concat(apdus.map(function (a) { return "  " + a; }).join("\n"), "\n  `\n}");
                        }));
                    })));
                }, rxjs_1.EMPTY);
            }), (0, operators_1.reduce)(function (jsCodes, code) { return jsCodes.concat(code); }, []), (0, operators_1.map)(function (codes) { return "{\n  name: \"".concat(account.name, "\",\n  raw: ").concat(JSON.stringify((0, account_1.toAccountRaw)(__assign(__assign({}, account), { operations: [], balanceHistory: undefined, freshAddresses: [] }))), ",\n  transactions: [\n    ").concat(codes.join(","), "\n  ]\n  }"); }));
        }));
    }
};
//# sourceMappingURL=generateTestTransaction.js.map