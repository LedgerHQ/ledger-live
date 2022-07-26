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
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var scan_1 = require("../scan");
exports["default"] = {
    description: "Synchronize accounts with blockchain",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(account_1.accountFormatters).join(" | "),
            desc: "how to display the data"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.switchMap)(function (account) { return __awaiter(void 0, void 0, void 0, function () {
            var currencyId, currency, currencyBridge, nftResolvers, _a, _b;
            var _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        currencyId = (0, account_1.decodeAccountId)(account.id).currencyId;
                        currency = (0, currencies_1.getCryptoCurrencyById)(currencyId);
                        currencyBridge = (0, bridge_1.getCurrencyBridge)(currency);
                        nftResolvers = currencyBridge.nftResolvers;
                        if (!(((_d = account.nfts) === null || _d === void 0 ? void 0 : _d.length) && (nftResolvers === null || nftResolvers === void 0 ? void 0 : nftResolvers.nftMetadata))) return [3 /*break*/, 2];
                        _b = [__assign({}, account)];
                        _c = {};
                        return [4 /*yield*/, Promise.all(account.nfts.map(function (nft) { return __awaiter(void 0, void 0, void 0, function () {
                                var metadata;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, (nftResolvers === null || nftResolvers === void 0 ? void 0 : nftResolvers.nftMetadata({
                                                contract: nft.contract,
                                                tokenId: nft.tokenId,
                                                currencyId: nft.currencyId
                                            }))];
                                        case 1:
                                            metadata = (_a.sent()).result;
                                            return [2 /*return*/, __assign(__assign({}, nft), { metadata: metadata })];
                                    }
                                });
                            }); }))["catch"](function () { return account.nfts; })];
                    case 1:
                        _a = __assign.apply(void 0, _b.concat([(_c.nfts = _e.sent(), _c)]));
                        return [3 /*break*/, 3];
                    case 2:
                        _a = account;
                        _e.label = 3;
                    case 3: return [2 /*return*/, _a];
                }
            });
        }); }), (0, operators_1.map)(function (account) {
            return (account_1.accountFormatters[opts.format] || account_1.accountFormatters["default"])(account);
        }));
    }
};
//# sourceMappingURL=sync.js.map