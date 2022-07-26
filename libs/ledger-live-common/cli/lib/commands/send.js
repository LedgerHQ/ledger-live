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
var env_1 = require("@ledgerhq/live-common/lib/env");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var account_1 = require("@ledgerhq/live-common/lib/account");
var transaction_1 = require("@ledgerhq/live-common/lib/transaction");
var scan_1 = require("../scan");
var transaction_2 = require("../transaction");
exports["default"] = {
    description: "Send crypto-assets",
    args: __spreadArray(__spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), __read(transaction_2.inferTransactionsOpts), false), [
        {
            name: "ignore-errors",
            type: Boolean,
            desc: "when using multiple transactions, an error won't stop the flow"
        },
        {
            name: "disable-broadcast",
            type: Boolean,
            desc: "do not broadcast the transaction"
        },
        {
            name: "format",
            type: String,
            desc: "default | json | silent"
        },
    ], false),
    job: function (opts) {
        var l = opts.format !== "json" && opts.format !== "silent" // eslint-disable-next-line no-console
            ? function (l) { return console.log(l); }
            : function (_l) { };
        return (0, scan_1.scan)(opts).pipe((0, operators_1.tap)(function (account) {
            l("\u2192 FROM ".concat((0, account_1.formatAccount)(account, "basic")));
        }), (0, operators_1.switchMap)(function (account) {
            return (0, rxjs_1.from)((0, transaction_2.inferTransactions)(account, opts)).pipe((0, operators_1.concatMap)(function (inferred) {
                return inferred.reduce(function (acc, _a) {
                    var _b = __read(_a, 2), t = _b[0], status = _b[1];
                    return (0, rxjs_1.concat)(acc, (0, rxjs_1.from)((0, rxjs_1.defer)(function () {
                        var _a;
                        l("\u2714\uFE0F transaction ".concat((0, transaction_1.formatTransaction)(t, account)));
                        l("STATUS ".concat((0, transaction_1.formatTransactionStatus)(t, status, account)));
                        var bridge = (0, bridge_1.getAccountBridge)(account);
                        return (_a = bridge
                            .signOperation({
                            account: account,
                            transaction: t,
                            deviceId: opts.device || ""
                        }))
                            .pipe.apply(_a, __spreadArray(__spreadArray([(0, operators_1.map)(transaction_1.toSignOperationEventRaw)], __read((opts["disable-broadcast"] ||
                            (0, env_1.getEnv)("DISABLE_TRANSACTION_BROADCAST")
                            ? []
                            : [
                                (0, operators_1.concatMap)(function (e) {
                                    if (e.type === "signed") {
                                        l("\u2714\uFE0F has been signed! ".concat(JSON.stringify(e.signedOperation)));
                                        return (0, rxjs_1.from)(bridge
                                            .broadcast({
                                            account: account,
                                            signedOperation: e.signedOperation
                                        })
                                            .then(function (op) {
                                            l("\u2714\uFE0F broadcasted! optimistic operation: ".concat((0, account_1.formatOperation)(account)(
                                            // @ts-expect-error we are supposed to give an OperationRaw and yet it's an Operation
                                            (0, account_1.fromOperationRaw)(op, account.id))));
                                            return op;
                                        }));
                                    }
                                    return (0, rxjs_1.of)(e);
                                }),
                            ])), false), __read((opts["ignore-errors"]
                            ? [
                                (0, operators_1.catchError)(function (e) {
                                    return (0, rxjs_1.of)({
                                        type: "error",
                                        error: e,
                                        transaction: t
                                    });
                                }),
                            ]
                            : [])), false));
                    })));
                }, rxjs_1.EMPTY);
            }), (0, operators_1.mergeMap)(function (obj) {
                return opts.format !== "json" ? rxjs_1.EMPTY : (0, rxjs_1.of)(JSON.stringify(obj));
            }));
        }));
    }
};
//# sourceMappingURL=send.js.map