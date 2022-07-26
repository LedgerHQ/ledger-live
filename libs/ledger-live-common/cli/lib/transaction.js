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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.inferTransactions = exports.inferTransactionsOpts = void 0;
require("lodash.product");
// @ts-expect-error we imported lodash.product but not recognized by TS in lodash
var lodash_1 = require("lodash");
var uniqBy_1 = __importDefault(require("lodash/uniqBy"));
var shuffle_1 = __importDefault(require("lodash/shuffle"));
var flatMap_1 = __importDefault(require("lodash/flatMap"));
var bignumber_js_1 = require("bignumber.js");
var cli_transaction_1 = __importDefault(require("@ledgerhq/live-common/lib/generated/cli-transaction"));
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var account_1 = require("@ledgerhq/live-common/lib/account");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var inferAmount = function (account, str) {
    var currency = (0, account_1.getAccountCurrency)(account);
    var units = currency.units;
    if (str.endsWith("%")) {
        return account.balance.times(0.01 * parseFloat(str.replace("%", "")));
    }
    var lowerCase = str.toLowerCase();
    for (var i = 0; i < units.length; i++) {
        var unit = units[i];
        var code = unit.code.toLowerCase();
        if (lowerCase.includes(code)) {
            return (0, currencies_1.parseCurrencyUnit)(unit, lowerCase.replace(code, ""));
        }
    }
    return (0, currencies_1.parseCurrencyUnit)(units[0], str);
};
exports.inferTransactionsOpts = (0, uniqBy_1["default"])([
    {
        name: "self-transaction",
        type: Boolean,
        desc: "Pre-fill the transaction for the account to send to itself"
    },
    {
        name: "use-all-amount",
        type: Boolean,
        desc: "Send MAX of the account balance"
    },
    {
        name: "recipient",
        type: String,
        desc: "the address to send funds to",
        multiple: true
    },
    {
        name: "amount",
        type: String,
        desc: "how much to send in the main currency unit"
    },
    {
        name: "shuffle",
        type: Boolean,
        desc: "if using multiple token or recipient, order will be randomized"
    },
    {
        name: "collection",
        type: String,
        desc: "collection of an NFT (in corelation with --tokenIds)"
    },
    {
        name: "tokenIds",
        type: String,
        desc: "tokenId or list of tokenIds of an NFT separated by commas (order is kept in corelation with --quantities)"
    },
    {
        name: "quantities",
        type: String,
        desc: "quantity or list of quantity of an ERC1155 NFT separated by commas (order is kept in corelation with --tokenIds)"
    },
].concat((0, flatMap_1["default"])(Object.values(cli_transaction_1["default"]), function (m) { return (m && m.options) || []; })), "name");
function inferTransactions(mainAccount, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var bridge, specific, inferAccounts, inferTransactions, all, transactions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bridge = (0, bridge_1.getAccountBridge)(mainAccount, null);
                    specific = cli_transaction_1["default"][mainAccount.currency.family];
                    inferAccounts = (specific && specific.inferAccounts) || (function (account, _opts) { return [account]; });
                    inferTransactions = (specific && specific.inferTransactions) ||
                        (function (transactions, _opts, _r) { return transactions; });
                    return [4 /*yield*/, Promise.all((0, lodash_1.product)(inferAccounts(mainAccount, opts), opts.recipient || [
                            opts["self-transaction"] ? mainAccount.freshAddress : "",
                        ]).map(function (_a) {
                            var _b = __read(_a, 2), account = _b[0], recipient = _b[1];
                            return __awaiter(_this, void 0, void 0, function () {
                                var transaction;
                                var _c, _d;
                                return __generator(this, function (_e) {
                                    transaction = bridge.createTransaction(mainAccount);
                                    transaction.recipient = recipient;
                                    transaction.useAllAmount = !!opts["use-all-amount"];
                                    transaction.amount = transaction.useAllAmount
                                        ? new bignumber_js_1.BigNumber(0)
                                        : inferAmount(account, opts.amount || "0");
                                    // NFT collection and tokenId go by pair
                                    if (opts.tokenIds && opts.collection) {
                                        transaction.tokenIds = opts.tokenIds.split(",");
                                        transaction.collection = opts.collection;
                                        transaction.quantities = (_d = (_c = opts.quantities) === null || _c === void 0 ? void 0 : _c.split(",")) === null || _d === void 0 ? void 0 : _d.map(function (q) { return new bignumber_js_1.BigNumber(q); });
                                    }
                                    return [2 /*return*/, {
                                            account: account,
                                            transaction: transaction,
                                            mainAccount: mainAccount
                                        }];
                                });
                            });
                        }))];
                case 1:
                    all = _a.sent();
                    if (opts.shuffle) {
                        all = (0, shuffle_1["default"])(all);
                    }
                    return [4 /*yield*/, Promise.all(inferTransactions(all, opts, {
                            inferAmount: inferAmount
                        }).map(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                            var tx, status, errorKeys;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, bridge.prepareTransaction(mainAccount, transaction)];
                                    case 1:
                                        tx = _a.sent();
                                        return [4 /*yield*/, bridge.getTransactionStatus(mainAccount, tx)];
                                    case 2:
                                        status = _a.sent();
                                        errorKeys = Object.keys(status.errors);
                                        if (errorKeys.length) {
                                            throw status.errors[errorKeys[0]];
                                        }
                                        return [2 /*return*/, [tx, status]];
                                }
                            });
                        }); }))];
                case 2:
                    transactions = _a.sent();
                    return [2 /*return*/, transactions];
            }
        });
    });
}
exports.inferTransactions = inferTransactions;
//# sourceMappingURL=transaction.js.map