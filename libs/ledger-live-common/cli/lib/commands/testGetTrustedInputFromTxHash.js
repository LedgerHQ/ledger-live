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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var scan_1 = require("../scan");
var rxjs_1 = require("rxjs");
var invariant_1 = __importDefault(require("invariant"));
var hw_app_btc_1 = __importDefault(require("@ledgerhq/hw-app-btc"));
var network_1 = __importDefault(require("@ledgerhq/live-common/lib/network"));
var Ledger_1 = require("@ledgerhq/live-common/lib/api/Ledger");
var cryptoassets_1 = require("@ledgerhq/cryptoassets");
var command = function (transport, currencyId, hash) { return __awaiter(void 0, void 0, void 0, function () {
    var btc, currency, bitcoinLikeInfo, ledgerExplorer, endpoint, version, id, res, hex, hasExtraData, tx, outHash, ouHash, finalOut;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                btc = new hw_app_btc_1["default"](transport);
                currency = (0, cryptoassets_1.findCryptoCurrencyById)(currencyId);
                (0, invariant_1["default"])(currency, "currency not found");
                if (!currency)
                    throw new Error("currency not found");
                bitcoinLikeInfo = currency.bitcoinLikeInfo;
                (0, invariant_1["default"])(currency.family === "bitcoin" && bitcoinLikeInfo, "currency of bitcoin family only");
                ledgerExplorer = (0, Ledger_1.findCurrencyExplorer)(currency);
                (0, invariant_1["default"])(ledgerExplorer, "ledgerExplorer not found");
                if (!ledgerExplorer)
                    throw new Error("ledgerExplorer not found");
                endpoint = ledgerExplorer.endpoint, version = ledgerExplorer.version, id = ledgerExplorer.id;
                return [4 /*yield*/, (0, network_1["default"])({
                        url: "".concat(endpoint, "/blockchain/").concat(version, "/").concat(id, "/transactions/").concat(hash, "/hex")
                    })];
            case 1:
                res = _a.sent();
                hex = res.data[0] && res.data[0].hex;
                if (!hex)
                    return [2 /*return*/, "Backend returned no hex for this hash"];
                hasExtraData = currency.id === "zcash" ||
                    currency.id === "komodo" ||
                    currency.id === "zencash";
                tx = btc.splitTransaction(hex, currency.supportsSegwit, (currency.id === "stealthcoin" && hex.slice(0, 2) === "01") ||
                    (bitcoinLikeInfo === null || bitcoinLikeInfo === void 0 ? void 0 : bitcoinLikeInfo.hasTimestamp), hasExtraData, [currency.id]);
                return [4 /*yield*/, btc.getTrustedInput(0, tx, [currency.id])];
            case 2:
                outHash = _a.sent();
                ouHash = outHash.substring(8, 72);
                finalOut = Buffer.from(ouHash, "hex").reverse().toString("hex");
                return [2 /*return*/, {
                        inHash: hash,
                        finalOut: finalOut
                    }];
        }
    });
}); };
exports["default"] = {
    args: [
        scan_1.deviceOpt,
        {
            name: "currency",
            alias: "c",
            type: String
        },
        {
            name: "hash",
            alias: "h",
            type: String
        },
    ],
    job: function (_a) {
        var device = _a.device, currency = _a.currency, hash = _a.hash;
        return (0, deviceAccess_1.withDevice)(device || "")(function (transport) {
            return (0, rxjs_1.from)(command(transport, currency, hash));
        });
    }
};
//# sourceMappingURL=testGetTrustedInputFromTxHash.js.map