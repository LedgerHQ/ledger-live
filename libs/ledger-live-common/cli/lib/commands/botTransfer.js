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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
exports.__esModule = true;
/* eslint-disable no-console */
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var env_1 = require("@ledgerhq/live-common/lib/env");
var promise_1 = require("@ledgerhq/live-common/lib/promise");
var cache_1 = require("@ledgerhq/live-common/lib/bridge/cache");
var engine_1 = require("@ledgerhq/live-common/lib/bot/engine");
var speculos_1 = require("@ledgerhq/live-common/lib/load/speculos");
var account_1 = require("@ledgerhq/live-common/lib/account");
var logic_1 = require("@ledgerhq/live-common/lib/countervalues/logic");
var CONCURRENT = 3;
exports["default"] = {
    description: "transfer funds from one seed (SEED) to another (SEED_RECIPIENT)",
    args: [],
    job: function () {
        var localCache = {};
        var cache = (0, cache_1.makeBridgeCacheSystem)({
            saveData: function (c, d) {
                localCache[c.id] = d;
                return Promise.resolve();
            },
            getData: function (c) {
                return Promise.resolve(localCache[c.id]);
            }
        });
        function getAllRecipients() {
            return __awaiter(this, void 0, void 0, function () {
                var prevSeed, SEED_RECIPIENT, recipientsPerCurrencyId;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            prevSeed = (0, env_1.getEnv)("SEED");
                            SEED_RECIPIENT = process.env.SEED_RECIPIENT;
                            (0, env_1.setEnv)("SEED", SEED_RECIPIENT);
                            recipientsPerCurrencyId = new Map();
                            return [4 /*yield*/, (0, promise_1.promiseAllBatched)(CONCURRENT, (0, currencies_1.listSupportedCurrencies)(), function (currency) { return __awaiter(_this, void 0, void 0, function () {
                                    var device, r, maybeAddress, e_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 4, 5, 6]);
                                                return [4 /*yield*/, (0, speculos_1.createImplicitSpeculos)("speculos:nanos:".concat(currency.id))];
                                            case 1:
                                                r = _a.sent();
                                                if (!r)
                                                    return [2 /*return*/];
                                                device = r.device;
                                                return [4 /*yield*/, cache.prepareCurrency(currency)];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, (0, bridge_1.getCurrencyBridge)(currency)
                                                        .scanAccounts({
                                                        currency: currency,
                                                        deviceId: device.id,
                                                        syncConfig: {
                                                            paginationConfig: {}
                                                        }
                                                    })
                                                        .pipe((0, operators_1.filter)(function (e) { return e.type === "discovered"; }), (0, operators_1.first)(), (0, operators_1.timeoutWith)(120 * 1000, (0, rxjs_1.throwError)(new Error("scan account timeout"))), (0, operators_1.map)(function (e) { return e.account.freshAddress; }), (0, operators_1.catchError)(function (err) {
                                                        console.error("couldn't infer address for a " + currency.id + " account", err);
                                                        return (0, rxjs_1.of)(null);
                                                    }))
                                                        .toPromise()];
                                            case 3:
                                                maybeAddress = _a.sent();
                                                if (maybeAddress) {
                                                    recipientsPerCurrencyId.set(currency.id, maybeAddress);
                                                }
                                                return [3 /*break*/, 6];
                                            case 4:
                                                e_1 = _a.sent();
                                                console.error("Something went wrong on sending on " + currency.id, e_1);
                                                return [3 /*break*/, 6];
                                            case 5:
                                                if (device)
                                                    (0, speculos_1.releaseSpeculosDevice)(device.id);
                                                return [7 /*endfinally*/];
                                            case 6: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 1:
                            _a.sent();
                            (0, env_1.setEnv)("SEED", prevSeed);
                            return [2 /*return*/, recipientsPerCurrencyId];
                    }
                });
            });
        }
        function botPortfolio() {
            return __awaiter(this, void 0, void 0, function () {
                var accounts;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            accounts = [];
                            return [4 /*yield*/, (0, promise_1.promiseAllBatched)(CONCURRENT, (0, currencies_1.listSupportedCurrencies)(), function (currency) { return __awaiter(_this, void 0, void 0, function () {
                                    var device, r, e_2;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 3, 4, 5]);
                                                return [4 /*yield*/, (0, speculos_1.createImplicitSpeculos)("speculos:nanos:".concat(currency.id))];
                                            case 1:
                                                r = _a.sent();
                                                if (!r)
                                                    return [2 /*return*/];
                                                device = r.device;
                                                return [4 /*yield*/, (0, bridge_1.getCurrencyBridge)(currency)
                                                        .scanAccounts({
                                                        currency: currency,
                                                        deviceId: r.device.id,
                                                        syncConfig: {
                                                            paginationConfig: {}
                                                        }
                                                    })
                                                        .pipe((0, operators_1.timeoutWith)(200 * 1000, (0, rxjs_1.throwError)(new Error("scan account timeout"))), (0, operators_1.catchError)(function (e) {
                                                        console.error("scan accounts failed for " + currency.id, e);
                                                        return (0, rxjs_1.from)([]);
                                                    }), (0, operators_1.tap)(function (e) {
                                                        if (e.type === "discovered") {
                                                            accounts.push(e.account);
                                                        }
                                                    }))
                                                        .toPromise()];
                                            case 2:
                                                _a.sent();
                                                return [3 /*break*/, 5];
                                            case 3:
                                                e_2 = _a.sent();
                                                console.error("Something went wrong on portfolio of " + currency.id, e_2);
                                                return [3 /*break*/, 5];
                                            case 4:
                                                if (device)
                                                    (0, speculos_1.releaseSpeculosDevice)(device.id);
                                                return [7 /*endfinally*/];
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, accounts];
                    }
                });
            });
        }
        var cvUSDThreshold = 10;
        function sendAllFunds(accounts, recipientsPerCurrencyId) {
            return __awaiter(this, void 0, void 0, function () {
                var countervalue, countervaluesState;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            countervalue = (0, currencies_1.getFiatCurrencyByTicker)("USD");
                            return [4 /*yield*/, (0, logic_1.loadCountervalues)(logic_1.initialState, {
                                    trackingPairs: (0, logic_1.inferTrackingPairForAccounts)(accounts, countervalue),
                                    autofillGaps: true
                                })];
                        case 1:
                            countervaluesState = _a.sent();
                            return [4 /*yield*/, (0, promise_1.promiseAllBatched)(CONCURRENT, accounts, function (account) { return __awaiter(_this, void 0, void 0, function () {
                                    var currency, cv, recipient, accountBridge, plannedTransactions, device, r, plannedTransactions_1, plannedTransactions_1_1, tx, transaction, status_1, signedOperation, optimisticOperation, _a, e_3_1, e_4;
                                    var e_3, _b;
                                    var _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                currency = account.currency;
                                                cv = (0, logic_1.calculate)(countervaluesState, {
                                                    from: currency,
                                                    to: countervalue,
                                                    value: account.balance.toNumber()
                                                });
                                                if (!cv || cv < cvUSDThreshold) {
                                                    return [2 /*return*/];
                                                }
                                                recipient = recipientsPerCurrencyId.get(currency.id);
                                                if (!recipient) {
                                                    console.log("no recipient to empty account " + account.id);
                                                    return [2 /*return*/];
                                                }
                                                accountBridge = (0, bridge_1.getAccountBridge)(account);
                                                plannedTransactions = [];
                                                // FIXME better value than this arbitrary one: calc countervalues
                                                (_c = account.subAccounts) === null || _c === void 0 ? void 0 : _c.forEach(function (subAccount) {
                                                    var cv = (0, logic_1.calculate)(countervaluesState, {
                                                        from: account.currency,
                                                        to: countervalue,
                                                        value: subAccount.balance.toNumber()
                                                    });
                                                    if (cv && cv > cvUSDThreshold) {
                                                        plannedTransactions.push(accountBridge.updateTransaction(accountBridge.createTransaction(account), {
                                                            recipient: recipient,
                                                            useAllAmount: true,
                                                            subAccountId: subAccount.id
                                                        }));
                                                    }
                                                });
                                                plannedTransactions.push(accountBridge.updateTransaction(accountBridge.createTransaction(account), {
                                                    recipient: recipient,
                                                    useAllAmount: true
                                                }));
                                                _d.label = 1;
                                            case 1:
                                                _d.trys.push([1, 16, 17, 18]);
                                                return [4 /*yield*/, (0, speculos_1.createImplicitSpeculos)("speculos:nanos:".concat(currency.id))];
                                            case 2:
                                                r = _d.sent();
                                                _d.label = 3;
                                            case 3:
                                                _d.trys.push([3, 13, 14, 15]);
                                                plannedTransactions_1 = __values(plannedTransactions), plannedTransactions_1_1 = plannedTransactions_1.next();
                                                _d.label = 4;
                                            case 4:
                                                if (!!plannedTransactions_1_1.done) return [3 /*break*/, 12];
                                                tx = plannedTransactions_1_1.value;
                                                return [4 /*yield*/, accountBridge.prepareTransaction(account, tx)];
                                            case 5:
                                                transaction = _d.sent();
                                                return [4 /*yield*/, accountBridge.getTransactionStatus(account, transaction)];
                                            case 6:
                                                status_1 = _d.sent();
                                                if (Object.keys(status_1.errors).length !== 0) {
                                                    return [3 /*break*/, 11];
                                                }
                                                if (!r) {
                                                    console.warn("couldn't create a speculos transport for " + currency.id);
                                                    return [2 /*return*/];
                                                }
                                                device = r.device;
                                                return [4 /*yield*/, accountBridge
                                                        .signOperation({
                                                        account: account,
                                                        transaction: transaction,
                                                        deviceId: device.id
                                                    })
                                                        .pipe((0, engine_1.autoSignTransaction)({
                                                        transport: device.transport,
                                                        deviceAction: (0, engine_1.getImplicitDeviceAction)(account.currency),
                                                        appCandidate: r.appCandidate,
                                                        account: account,
                                                        transaction: transaction,
                                                        status: status_1
                                                    }), (0, operators_1.first)(function (e) { return e.type === "signed"; }), (0, operators_1.map)(function (e) { return e.signedOperation; }))
                                                        .toPromise()];
                                            case 7:
                                                signedOperation = _d.sent();
                                                if (!(0, env_1.getEnv)("DISABLE_TRANSACTION_BROADCAST")) return [3 /*break*/, 8];
                                                _a = signedOperation.operation;
                                                return [3 /*break*/, 10];
                                            case 8: return [4 /*yield*/, accountBridge.broadcast({
                                                    account: account,
                                                    signedOperation: signedOperation
                                                })];
                                            case 9:
                                                _a = _d.sent();
                                                _d.label = 10;
                                            case 10:
                                                optimisticOperation = _a;
                                                console.log((0, account_1.formatOperation)(account)(optimisticOperation));
                                                _d.label = 11;
                                            case 11:
                                                plannedTransactions_1_1 = plannedTransactions_1.next();
                                                return [3 /*break*/, 4];
                                            case 12: return [3 /*break*/, 15];
                                            case 13:
                                                e_3_1 = _d.sent();
                                                e_3 = { error: e_3_1 };
                                                return [3 /*break*/, 15];
                                            case 14:
                                                try {
                                                    if (plannedTransactions_1_1 && !plannedTransactions_1_1.done && (_b = plannedTransactions_1["return"])) _b.call(plannedTransactions_1);
                                                }
                                                finally { if (e_3) throw e_3.error; }
                                                return [7 /*endfinally*/];
                                            case 15: return [3 /*break*/, 18];
                                            case 16:
                                                e_4 = _d.sent();
                                                console.error("Something went wrong on sending on account " + account.id, e_4);
                                                return [3 /*break*/, 18];
                                            case 17:
                                                if (device)
                                                    (0, speculos_1.releaseSpeculosDevice)(device.id);
                                                return [7 /*endfinally*/];
                                            case 18: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function main() {
            return __awaiter(this, void 0, void 0, function () {
                var recipientsPerCurrencyId, accounts;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, getAllRecipients()];
                        case 1:
                            recipientsPerCurrencyId = _a.sent();
                            console.log(Array.from(recipientsPerCurrencyId.keys()).length +
                                " RECIPIENTS FETCHED");
                            return [4 /*yield*/, botPortfolio()];
                        case 2:
                            accounts = _a.sent();
                            console.log("BOT PORTFOLIO FETCHED ".concat(accounts.length, " accounts"));
                            return [4 /*yield*/, sendAllFunds(accounts, recipientsPerCurrencyId)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        return (0, rxjs_1.from)(main());
    }
};
//# sourceMappingURL=botTransfer.js.map