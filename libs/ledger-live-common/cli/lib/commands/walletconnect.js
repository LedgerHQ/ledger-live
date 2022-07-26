"use strict";
/* eslint-disable no-console */
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
/* eslint-disable no-fallthrough */
var scan_1 = require("../scan");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var rxjs_2 = require("rxjs");
var logs_1 = require("@ledgerhq/logs");
var client_1 = __importDefault(require("@walletconnect/client"));
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var walletconnect_1 = require("@ledgerhq/live-common/lib/walletconnect");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var signMessage_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/signMessage"));
var Ethereum_1 = require("@ledgerhq/live-common/lib/api/Ethereum");
var start = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var account, connector, rejectRequest, approveRequest, handleCallRequest;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, scan_1.scan)(opts).pipe((0, operators_1.take)(1)).toPromise()];
            case 1:
                account = _a.sent();
                if (!account) {
                    throw new Error("No account");
                }
                (0, logs_1.log)("walletconnect", "account", account);
                connector = new client_1["default"](opts.walletConnectSession
                    ? {
                        session: JSON.parse(opts.walletConnectSession)
                    }
                    : {
                        // Required
                        uri: opts.walletConnectURI,
                        // Required
                        clientMeta: {
                            description: "LedgerLive CLI",
                            url: "https://ledger.fr",
                            icons: [
                                "https://avatars0.githubusercontent.com/u/9784193?s=400&v=4",
                            ],
                            name: "LedgerLive CLI"
                        }
                    });
                rejectRequest = function (id, message) {
                    var rejection = {
                        id: id,
                        error: {
                            message: message
                        }
                    };
                    (0, logs_1.log)("walletconnect", "rejected", rejection);
                    connector.rejectRequest(rejection);
                };
                approveRequest = function (id, result) {
                    var approval = {
                        id: id,
                        result: result
                    };
                    (0, logs_1.log)("walletconnect", "approved", approval);
                    connector.approveRequest(approval);
                };
                handleCallRequest = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
                    var wcCallRequest, result, bridge, api, operation;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                (0, logs_1.log)("walletconnect", "call_request", payload);
                                return [4 /*yield*/, (0, walletconnect_1.parseCallRequest)(account, payload)];
                            case 1:
                                wcCallRequest = _a.sent();
                                bridge = (0, bridge_1.getAccountBridge)(account);
                                if (!(wcCallRequest.type === "broadcast")) return [3 /*break*/, 3];
                                api = (0, Ethereum_1.apiForCurrency)(account.currency);
                                return [4 /*yield*/, api.broadcastTransaction(wcCallRequest.data)];
                            case 2:
                                result = _a.sent();
                                (0, logs_1.log)("walletconnect", "hash", result);
                                return [2 /*return*/, result];
                            case 3:
                                if (!(wcCallRequest.type === "message")) return [3 /*break*/, 5];
                                (0, logs_1.log)("walletconnect", "message to sign", wcCallRequest.data);
                                return [4 /*yield*/, (0, deviceAccess_1.withDevice)(opts.device || "")(function (t) {
                                        return (0, rxjs_1.from)((0, signMessage_1["default"])(t, wcCallRequest.data));
                                    }).toPromise()];
                            case 4:
                                result = _a.sent();
                                result = result.signature;
                                (0, logs_1.log)("walletconnect", "message signature", result);
                                return [2 /*return*/, result];
                            case 5:
                                if (!(wcCallRequest.type === "transaction")) return [3 /*break*/, 8];
                                return [4 /*yield*/, bridge
                                        .signOperation({
                                        account: account,
                                        deviceId: opts.device || "",
                                        transaction: wcCallRequest.data
                                    })
                                        .pipe((0, operators_1.tap)(function (e) { return console.log(e); }), (0, operators_1.first)(function (e) { return e.type === "signed"; }), (0, operators_1.map)(function (e) {
                                        if (e.type === "signed") {
                                            return e.signedOperation;
                                        }
                                    }))
                                        .toPromise()];
                            case 6:
                                operation = _a.sent();
                                (0, logs_1.log)("walletconnect", "operation", operation);
                                if (wcCallRequest.method === "sign") {
                                    return [2 /*return*/, operation.signature];
                                }
                                return [4 /*yield*/, bridge.broadcast({
                                        account: account,
                                        signedOperation: operation
                                    })];
                            case 7:
                                operation = _a.sent();
                                (0, logs_1.log)("walletconnect", "operation broadcasted", operation);
                                return [2 /*return*/, operation.hash];
                            case 8: throw new Error("JSON RPC method not supported");
                        }
                    });
                }); };
                connector.on("session_request", function (error, payload) {
                    if (error) {
                        throw error;
                    }
                    (0, logs_1.log)("walletconnect", "session_request", payload);
                    connector.approveSession({
                        accounts: [account.freshAddress],
                        chainId: account.currency.ethereumLikeInfo.chainId
                    });
                });
                connector.on("call_request", function (error, payload) { return __awaiter(void 0, void 0, void 0, function () {
                    var result, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (error) {
                                    throw error;
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, handleCallRequest(payload)];
                            case 2:
                                result = _a.sent();
                                approveRequest(payload.id, result);
                                return [3 /*break*/, 4];
                            case 3:
                                e_1 = _a.sent();
                                rejectRequest(payload.id, e_1.message);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                connector.on("connect", function (error) {
                    if (error) {
                        throw error;
                    }
                    (0, logs_1.log)("walletconnect", "connected", JSON.stringify(connector.session).replace(/"/g, "\\\""));
                });
                return [2 /*return*/];
        }
    });
}); };
exports["default"] = {
    description: "Create a walletconnect session",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "walletConnectURI",
            type: String,
            desc: "WallecConnect URI to use."
        },
        {
            name: "walletConnectSession",
            type: String,
            desc: "WallecConnect Session to use."
        },
        {
            name: "verbose",
            alias: "v",
            type: Boolean,
            desc: "verbose mode"
        },
        {
            name: "silent",
            type: Boolean,
            desc: "do not output the proxy logs"
        },
    ], false),
    job: function (opts) {
        return rxjs_2.Observable.create(function (o) {
            var unsub = (0, logs_1.listen)(function (l) {
                if (opts.verbose) {
                    o.next(l.type + ": " + l.message);
                }
                else if (!opts.silent && l.type === "walletconnect") {
                    o.next(l.message);
                }
            });
            start(opts);
            return function () {
                unsub();
            };
        });
    }
};
//# sourceMappingURL=walletconnect.js.map