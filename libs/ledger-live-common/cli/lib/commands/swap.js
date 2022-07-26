"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var cryptoassets_1 = require("@ledgerhq/cryptoassets");
var rxjs_1 = require("rxjs");
var bignumber_js_1 = require("bignumber.js");
var command_line_args_1 = __importDefault(require("command-line-args"));
var promise_1 = require("@ledgerhq/live-common/lib/promise");
var scan_1 = require("../scan");
var swap_1 = require("@ledgerhq/live-common/lib/exchange/swap");
var swap_2 = require("@ledgerhq/live-common/lib/exchange/swap");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var account_2 = require("@ledgerhq/live-common/lib/account");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var invariant_1 = __importDefault(require("invariant"));
var exec = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var amount, useAllAmount, tokenId, useFloat, _a, wyreUserId, _b, deviceId, secondAccountOpts, fromParentAccount, fromAccount, token, subAccounts, subAccount, formattedAmount, toParentAccount, toAccount, tokenId2, token, subAccounts, subAccount, bridge, transaction, amount_1, exchange, exchangeRates, exchangeRate, initSwapResult, mainFromAccount, signedOperation, operation;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                amount = opts.amount, useAllAmount = opts.useAllAmount, tokenId = opts.tokenId, useFloat = opts.useFloat, _a = opts.wyreUserId, wyreUserId = _a === void 0 ? "" : _a, _b = opts.deviceId, deviceId = _b === void 0 ? "" : _b;
                (0, invariant_1["default"])(amount || useAllAmount, "\u2716 amount in satoshis is needed or --useAllAmount ");
                (0, invariant_1["default"])(opts._unknown, "\u2716 second account information is missing");
                (0, invariant_1["default"])(!wyreUserId || wyreUserId.length === 14, "Provider wyre user id is not valid");
                secondAccountOpts = (0, command_line_args_1["default"])(__spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
                    {
                        name: "tokenId",
                        alias: "t",
                        type: String,
                        desc: "use a token account children of the account"
                    },
                ], false), {
                    argv: opts._unknown.map(function (a, i) { return (i % 2 ? a : a.replace("_2", "")); })
                });
                console.log("• Open the source currency app");
                return [4 /*yield*/, (0, promise_1.delay)(8000)];
            case 1:
                _c.sent();
                fromParentAccount = null;
                return [4 /*yield*/, (0, scan_1.scan)(opts)
                        .pipe((0, operators_1.take)(1))
                        .toPromise()];
            case 2:
                fromAccount = _c.sent();
                (0, invariant_1["default"])(fromAccount, "\u2716 No account found, is the right currency app open?");
                if (!fromAccount) {
                    throw new Error("\u2716 No account found, is the right currency app open?");
                }
                //Are we asking for a token account?
                if (tokenId) {
                    token = (0, cryptoassets_1.findTokenById)(tokenId);
                    (0, invariant_1["default"])(token, "\u2716 No token currency found with id ".concat(tokenId));
                    if (!token)
                        throw new Error("\u2716 No token currency found with id ".concat(tokenId));
                    subAccounts = (0, account_1.accountWithMandatoryTokens)(fromAccount, [token]).subAccounts || [];
                    subAccount = subAccounts.find(function (t) {
                        var currency = (0, account_1.getAccountCurrency)(t);
                        return tokenId === currency.id;
                    });
                    // We have a token account, keep track of both now;
                    fromParentAccount = fromAccount;
                    fromAccount = subAccount;
                    (0, invariant_1["default"])(fromAccount, "\u2716 No account found, is the right currency app open?");
                    if (!fromAccount) {
                        throw new Error("\u2716 No account found, is the right currency app open?");
                    }
                }
                if (fromParentAccount) {
                    console.log("\t:parentId:\t\t", fromParentAccount.id);
                }
                console.log("\t:id:\t\t", fromAccount.id);
                formattedAmount = (0, currencies_1.formatCurrencyUnit)((0, account_2.getAccountUnit)(fromAccount), fromAccount.balance, {
                    disableRounding: true,
                    alwaysShowSign: false,
                    showCode: true
                });
                if (fromAccount.type !== "ChildAccount") {
                    console.log("\t:balance:\t", fromAccount.spendableBalance.toString(), " [ ".concat(formattedAmount, " ]"));
                }
                (0, invariant_1["default"])(fromAccount.balance.gte(new bignumber_js_1.BigNumber(amount)), "\u2716 Not enough balance");
                console.log("• Open the destination currency app");
                return [4 /*yield*/, (0, promise_1.delay)(8000)];
            case 3:
                _c.sent();
                toParentAccount = null;
                return [4 /*yield*/, (0, scan_1.scan)(secondAccountOpts)
                        .pipe((0, operators_1.take)(1))
                        .toPromise()];
            case 4:
                toAccount = _c.sent();
                (0, invariant_1["default"])(toAccount, "\u2716 No account found");
                tokenId2 = secondAccountOpts.tokenId;
                //Are we asking for a token account?
                if (tokenId2) {
                    token = (0, cryptoassets_1.findTokenById)(tokenId2);
                    (0, invariant_1["default"])(token, "\u2716 No token currency found with id ".concat(tokenId2));
                    if (!token) {
                        throw new Error("\u2716 No token currency found with id ".concat(tokenId2));
                    }
                    subAccounts = (0, account_1.accountWithMandatoryTokens)(toAccount, [token]).subAccounts || [];
                    subAccount = subAccounts.find(function (t) {
                        var currency = (0, account_1.getAccountCurrency)(t);
                        return tokenId2 === currency.id;
                    });
                    // We have a token account, keep track of both now;
                    toParentAccount = toAccount;
                    toAccount = subAccount;
                    (0, invariant_1["default"])(fromAccount, "\u2716 No account found");
                }
                (0, invariant_1["default"])(toAccount, "\u2716 No account found");
                if (!toAccount)
                    throw new Error("\u2716 No account found");
                if (toParentAccount) {
                    console.log("\t:parentId:\t\t", toParentAccount.id);
                }
                console.log("\t:id:\t\t", toAccount.id);
                bridge = (0, bridge_1.getAccountBridge)(fromAccount, fromParentAccount);
                transaction = bridge.createTransaction((0, account_1.getMainAccount)(fromAccount, fromParentAccount));
                transaction = bridge.updateTransaction(transaction, {
                    recipient: (0, cryptoassets_1.getAbandonSeedAddress)((0, account_1.getAccountCurrency)((0, account_1.getMainAccount)(fromAccount, fromParentAccount)).id),
                    subAccountId: fromParentAccount ? fromAccount.id : undefined
                });
                if (!!useAllAmount) return [3 /*break*/, 5];
                transaction = bridge.updateTransaction(transaction, {
                    amount: new bignumber_js_1.BigNumber(amount)
                });
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, bridge.estimateMaxSpendable({
                    account: fromAccount,
                    parentAccount: fromParentAccount,
                    transaction: transaction
                })];
            case 6:
                amount_1 = _c.sent();
                transaction = bridge.updateTransaction(transaction, {
                    amount: amount_1
                });
                _c.label = 7;
            case 7: return [4 /*yield*/, bridge.prepareTransaction((0, account_1.getMainAccount)(fromAccount, fromParentAccount), transaction)];
            case 8:
                transaction = _c.sent();
                exchange = {
                    fromAccount: fromAccount,
                    fromParentAccount: fromParentAccount,
                    toAccount: toAccount,
                    toParentAccount: toParentAccount
                };
                return [4 /*yield*/, (0, swap_2.getExchangeRates)(exchange, transaction, wyreUserId)];
            case 9:
                exchangeRates = _c.sent();
                console.log({ exchangeRates: exchangeRates });
                exchangeRate = exchangeRates.find(function (er) {
                    if (er.tradeMethod === (useFloat ? "float" : "fixed") &&
                        (!wyreUserId || er.provider === "wyre")) {
                        return true;
                    }
                    return false;
                });
                (0, invariant_1["default"])(exchangeRate, "\u2716 No valid rate available");
                console.log("Using first ".concat(useFloat ? "float" : "fixed", " rate:\n"), exchangeRate);
                console.log({
                    transaction: transaction,
                    amount: transaction.amount.toString()
                });
                console.log("• Open the Exchange app");
                return [4 /*yield*/, (0, promise_1.delay)(8000)];
            case 10:
                _c.sent();
                return [4 /*yield*/, (0, swap_1.initSwap)({
                        exchange: exchange,
                        exchangeRate: exchangeRate,
                        transaction: transaction,
                        deviceId: deviceId,
                        userId: wyreUserId
                    })
                        .pipe((0, operators_1.tap)(function (e) {
                        switch (e.type) {
                            case "init-swap-requested":
                                console.log("• Confirm swap operation on your device");
                                break;
                            case "init-swap-error":
                                console.log(e);
                                (0, invariant_1["default"])(false, "Something went wrong confirming the swap");
                                // $FlowFixMe
                                break;
                            case "init-swap-result":
                                console.log(e);
                        }
                        if (e.type === "init-swap-requested")
                            console.log("• Confirm swap operation on your device");
                    }), (0, operators_1.filter)(function (e) { return e.type === "init-swap-result"; }), (0, operators_1.map)(function (e) {
                        if (e.type === "init-swap-result") {
                            return e.initSwapResult;
                        }
                    }))
                        .toPromise()];
            case 11:
                initSwapResult = _c.sent();
                transaction = initSwapResult.transaction;
                console.log("Device app switch & silent signing");
                return [4 /*yield*/, (0, promise_1.delay)(8000)];
            case 12:
                _c.sent();
                mainFromAccount = (0, account_1.getMainAccount)(fromAccount, fromParentAccount);
                return [4 /*yield*/, bridge
                        .signOperation({
                        account: mainFromAccount,
                        deviceId: deviceId,
                        transaction: transaction
                    })
                        .pipe((0, operators_1.tap)(function (e) { return console.log(e); }), (0, operators_1.first)(function (e) { return e.type === "signed"; }), (0, operators_1.map)(function (e) {
                        if (e.type === "signed") {
                            return e.signedOperation;
                        }
                    }))
                        .toPromise()];
            case 13:
                signedOperation = _c.sent();
                console.log("Broadcasting");
                return [4 /*yield*/, bridge.broadcast({
                        account: mainFromAccount,
                        signedOperation: signedOperation
                    })];
            case 14:
                operation = _c.sent();
                console.log({
                    operation: operation
                });
                return [2 /*return*/];
        }
    });
}); };
exports["default"] = {
    description: "Perform an arbitrary swap between two currencies on the same seed",
    args: __spreadArray([
        {
            name: "mock",
            alias: "m",
            type: Boolean,
            desc: "Whether or not to use the real backend or a mocked version"
        },
        {
            name: "amount",
            alias: "a",
            type: Number,
            desc: "Amount in satoshi units to send"
        },
        {
            name: "useAllAmount",
            alias: "u",
            type: Boolean,
            desc: "Attempt to send all using the emulated max amount calculation"
        },
        {
            name: "wyreUserId",
            alias: "w",
            type: String,
            desc: "If provided, will attempt to use Wyre provider with given userId"
        },
        {
            name: "tokenId",
            alias: "t",
            type: String,
            desc: "Use a token account children of the account"
        },
        {
            name: "useFloat",
            alias: "f",
            type: Boolean,
            desc: "Use first floating rate returned. Defaults to false."
        }
    ], __read(scan_1.scanCommonOpts), false),
    job: function (opts) { return (0, rxjs_1.from)(exec(opts)); }
};
//# sourceMappingURL=swap.js.map