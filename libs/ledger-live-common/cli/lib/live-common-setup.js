"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.closeAllDevices = exports.mockDeviceWithAPDUs = exports.releaseMockDevice = void 0;
__exportStar(require("./live-common-setup-base"), exports);
var react_1 = __importDefault(require("react"));
var invariant_1 = __importDefault(require("invariant"));
var hw_transport_mocker_1 = require("@ledgerhq/hw-transport-mocker");
var hw_transport_1 = __importDefault(require("@ledgerhq/hw-transport"));
var errors_1 = require("@ledgerhq/errors");
var logs_1 = require("@ledgerhq/logs");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var hw_transport_http_1 = __importDefault(require("@ledgerhq/hw-transport-http"));
var hw_transport_node_speculos_1 = __importDefault(require("@ledgerhq/hw-transport-node-speculos"));
var hw_1 = require("@ledgerhq/live-common/lib/hw");
var promise_1 = require("@ledgerhq/live-common/lib/promise");
var sanityChecks_1 = require("@ledgerhq/live-common/lib/sanityChecks");
var speculos_1 = require("@ledgerhq/live-common/lib/load/speculos");
var api_1 = require("@ledgerhq/live-common/lib/api");
(0, sanityChecks_1.checkLibs)({
    NotEnoughBalance: errors_1.NotEnoughBalance,
    React: react_1["default"],
    log: logs_1.log,
    Transport: hw_transport_1["default"]
});
var idCounter = 0;
var mockTransports = {};
var recordStores = {};
function releaseMockDevice(id) {
    var store = recordStores[id];
    (0, invariant_1["default"])(store, "MockDevice does not exist (%s)", id);
    try {
        store.ensureQueueEmpty();
    }
    finally {
        delete recordStores[id];
        delete mockTransports[id];
    }
}
exports.releaseMockDevice = releaseMockDevice;
function mockDeviceWithAPDUs(apdus) {
    return __awaiter(this, void 0, void 0, function () {
        var id, store, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = "mock:".concat(++idCounter);
                    store = hw_transport_mocker_1.RecordStore.fromString(apdus);
                    recordStores[id] = store;
                    _a = mockTransports;
                    _b = id;
                    return [4 /*yield*/, (0, hw_transport_mocker_1.openTransportReplayer)(store)];
                case 1:
                    _a[_b] = _c.sent();
                    return [2 /*return*/, id];
            }
        });
    });
}
exports.mockDeviceWithAPDUs = mockDeviceWithAPDUs;
(0, hw_1.registerTransportModule)({
    id: "mock",
    open: function (id) {
        if (id in mockTransports) {
            var Tr = mockTransports[id];
            return Tr;
        }
    },
    disconnect: function () { return Promise.resolve(); }
});
if (process.env.DEVICE_PROXY_URL) {
    var Tr_1 = (0, hw_transport_http_1["default"])(process.env.DEVICE_PROXY_URL.split("|"));
    (0, hw_1.registerTransportModule)({
        id: "http",
        open: function () {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return (0, promise_1.retry)(function () { return Tr_1.create(3000, 5000); }, {
                context: "open-http-proxy"
            });
        },
        disconnect: function () { return Promise.resolve(); }
    });
}
var _a = process.env, SPECULOS_APDU_PORT = _a.SPECULOS_APDU_PORT, SPECULOS_BUTTON_PORT = _a.SPECULOS_BUTTON_PORT, SPECULOS_HOST = _a.SPECULOS_HOST;
if (SPECULOS_APDU_PORT) {
    var req_1 = {
        apduPort: parseInt(SPECULOS_APDU_PORT, 10)
    };
    if (SPECULOS_BUTTON_PORT) {
        req_1.buttonPort = parseInt(SPECULOS_BUTTON_PORT, 10);
    }
    if (SPECULOS_HOST) {
        req_1.host = SPECULOS_HOST;
    }
    (0, hw_1.registerTransportModule)({
        id: "tcp",
        open: function () {
            return (0, promise_1.retry)(function () { return hw_transport_node_speculos_1["default"].open(req_1); }, {
                context: "open-tcp-speculos"
            });
        },
        disconnect: function () { return Promise.resolve(); }
    });
}
var cacheBle = {};
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var TransportNodeBle, getTransport, openBleByQuery, TransportNodeHid;
        var _this = this;
        return __generator(this, function (_a) {
            getTransport = function () { return __awaiter(_this, void 0, void 0, function () {
                var mod;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!TransportNodeBle) return [3 /*break*/, 2];
                            return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("@ledgerhq/hw-transport-node-ble")); })];
                        case 1:
                            mod = (_a.sent())["default"];
                            TransportNodeBle = mod;
                            _a.label = 2;
                        case 2: return [2 /*return*/, TransportNodeBle];
                    }
                });
            }); };
            openBleByQuery = function (query) { return __awaiter(_this, void 0, void 0, function () {
                var m, _a, q, t, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            m = query.match(/^ble:?(.*)/);
                            if (!m)
                                throw new Error("ble regexp should match");
                            _a = __read(m, 2), q = _a[1];
                            if (cacheBle[query])
                                return [2 /*return*/, cacheBle[query]];
                            if (!!q) return [3 /*break*/, 2];
                            return [4 /*yield*/, getTransport().constructor];
                        case 1:
                            _b = (_d.sent()).create();
                            return [3 /*break*/, 4];
                        case 2:
                            _c = rxjs_1.Observable.bind;
                            return [4 /*yield*/, getTransport().constructor];
                        case 3:
                            _b = new (_c.apply(rxjs_1.Observable, [void 0, (_d.sent()).listen]))()
                                .pipe((0, operators_1.first)(function (e) {
                                return (e.device.name || "").toLowerCase().includes(q.toLowerCase()) ||
                                    e.device.id.toLowerCase() === q.toLowerCase();
                            }), (0, operators_1.switchMap)(function (e) { return TransportNodeBle.open(e.descriptor); }))
                                .toPromise();
                            _d.label = 4;
                        case 4: return [4 /*yield*/, (_b)];
                        case 5:
                            t = _d.sent();
                            cacheBle[query] = t;
                            t.on("disconnect", function () {
                                delete cacheBle[query];
                            });
                            return [2 /*return*/, t];
                    }
                });
            }); };
            (0, hw_1.registerTransportModule)({
                id: "ble",
                open: function (query) {
                    if (query.startsWith("ble")) {
                        return openBleByQuery(query);
                    }
                },
                discovery: new rxjs_1.Observable(function (o) {
                    var s;
                    getTransport().then(function (module) {
                        module.constructor.listen(o);
                        s = module;
                    });
                    return function () { return s && s.unsubscribe(); };
                }).pipe((0, operators_1.map)(function (e) { return ({
                    type: e.type,
                    id: "ble:" + e.device.id,
                    name: e.device.name || ""
                }); })),
                disconnect: function (query) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!query.startsWith("ble")) return [3 /*break*/, 4];
                                if (!cacheBle[query]) return [3 /*break*/, 2];
                                return [4 /*yield*/, getTransport().constructor];
                            case 1:
                                _b = (_c.sent()).disconnect(cacheBle[query].id);
                                return [3 /*break*/, 3];
                            case 2:
                                _b = Promise.resolve();
                                _c.label = 3;
                            case 3:
                                _a = _b;
                                return [3 /*break*/, 5];
                            case 4:
                                _a = undefined;
                                _c.label = 5;
                            case 5: return [2 /*return*/, _a];
                        }
                    });
                }); }
            });
            TransportNodeHid = require("@ledgerhq/hw-transport-node-hid")["default"];
            (0, hw_1.registerTransportModule)({
                id: "hid",
                open: function (devicePath) {
                    return (0, promise_1.retry)(function () { return TransportNodeHid.open(devicePath); }, {
                        context: "open-hid"
                    });
                },
                discovery: new rxjs_1.Observable(TransportNodeHid.listen).pipe((0, operators_1.map)(function (e) { return ({
                    type: e.type,
                    id: e.device.path,
                    name: e.device.deviceName || ""
                }); })),
                disconnect: function () { return Promise.resolve(); }
            });
            return [2 /*return*/];
        });
    });
}
if (!process.env.CI) {
    init();
}
function closeAllDevices() {
    Object.keys(cacheBle).forEach(hw_1.disconnect);
    (0, speculos_1.closeAllSpeculosDevices)();
    (0, api_1.disconnectAll)();
}
exports.closeAllDevices = closeAllDevices;
//# sourceMappingURL=live-common-setup.js.map