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
/* eslint-disable global-require */
var hw_transport_mocker_1 = require("@ledgerhq/hw-transport-mocker");
var logs_1 = require("@ledgerhq/logs");
var hw_1 = require("@ledgerhq/live-common/lib/hw");
var fs_1 = __importDefault(require("fs"));
var http_1 = __importDefault(require("http"));
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var ws_1 = __importDefault(require("ws"));
var body_parser_1 = __importDefault(require("body-parser"));
var os_1 = __importDefault(require("os"));
var rxjs_1 = require("rxjs");
var scan_1 = require("../scan");
var args = [
    scan_1.deviceOpt,
    {
        name: "file",
        alias: "f",
        type: String,
        desc: "in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU."
    },
    {
        name: "verbose",
        alias: "v",
        type: Boolean,
        desc: "verbose mode"
    },
    {
        name: "silent",
        alias: "s",
        type: Boolean,
        desc: "do not output the proxy logs"
    },
    {
        name: "disable-auto-skip",
        type: Boolean,
        desc: "auto skip apdu that don't replay instead of error"
    },
    {
        name: "port",
        alias: "p",
        type: String,
        desc: "specify the http port to use (default: 8435)"
    },
    {
        name: "record",
        alias: "r",
        type: Boolean,
        desc: "see the description of --file"
    },
];
var job = function (_a) {
    var device = _a.device, file = _a.file, record = _a.record, port = _a.port, silent = _a.silent, verbose = _a.verbose, noAutoSkip = _a["disable-auto-skip"];
    return new rxjs_1.Observable(function (o) {
        var unsub = (0, logs_1.listen)(function (l) {
            if (verbose) {
                o.next(l.type + ": " + l.message);
            }
            else if (!silent && l.type === "proxy") {
                o.next(l.message);
            }
        });
        var Transport;
        var saveToFile = null;
        var recordStore;
        var getTransportLike = function () {
            return {
                open: function () { return (0, hw_1.open)(device || ""); },
                create: function () { return (0, hw_1.open)(device || ""); }
            };
        };
        // --file <file>
        // There are two ways to use the mock, either you record or you replay
        // record: using --record means that it's a decoration in node-hid that will just save to a file
        // replay: without --record, it's going to re-use a recorded file and mock a transport instead of using an actual device
        if (file) {
            if (record) {
                (0, logs_1.log)("proxy", "the APDUs will be recorded in ".concat(file));
                saveToFile = file;
                recordStore = new hw_transport_mocker_1.RecordStore([]);
                // FIXME: ok this is the funky part with `DecoratedTransport`, ignoring for now cuz it's bullshit typings
                // Has to be tackled during refacto
                // @ts-expect-error getTransportLike should return a Partial<Transport> and createTransportRecorder should accept it
                Transport = (0, hw_transport_mocker_1.createTransportRecorder)(getTransportLike(), recordStore);
            }
            else {
                recordStore = hw_transport_mocker_1.RecordStore.fromString(fs_1["default"].readFileSync(file, "utf8"), {
                    autoSkipUnknownApdu: !noAutoSkip
                });
                if (recordStore.isEmpty()) {
                    process.exit(0);
                }
                (0, logs_1.log)("proxy", "".concat(recordStore.queue.length, " mocked APDUs will be replayed from ").concat(file));
                Transport = {
                    open: function () { return (0, hw_transport_mocker_1.openTransportReplayer)(recordStore); },
                    create: function () { return (0, hw_transport_mocker_1.openTransportReplayer)(recordStore); }
                };
            }
        }
        else {
            Transport = getTransportLike();
        }
        var ifaces = os_1["default"].networkInterfaces();
        var ips = Object.keys(ifaces)
            .reduce(function (acc, ifname) {
            return acc.concat(ifaces[ifname].map(function (iface) {
                if (iface.family !== "IPv4" || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }
                return iface.address;
            }));
        }, [])
            .filter(function (a) { return a; });
        var PORT = port || "8435";
        var app = (0, express_1["default"])();
        var server = http_1["default"].createServer(app);
        var wss = new ws_1["default"].Server({
            server: server
        });
        app.use((0, cors_1["default"])());
        app.get("/", function (req, res) {
            res.sendStatus(200);
        });
        if (recordStore) {
            app.post("/end", function (req, res) {
                try {
                    if (!saveToFile) {
                        recordStore.ensureQueueEmpty();
                    }
                    res.sendStatus(200);
                    process.exit(0);
                }
                catch (e) {
                    res.sendStatus(400);
                    console.error(e.message);
                    process.exit(1);
                }
            });
        }
        var pending = false;
        app.post("/", body_parser_1["default"].json(), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var data, error, transport, e_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body)
                            return [2 /*return*/, res.sendStatus(400)];
                        data = null;
                        error = null;
                        if (pending) {
                            return [2 /*return*/, res.status(400).json({
                                    error: "an exchange query was already pending"
                                })];
                        }
                        pending = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, Transport.open()];
                    case 2:
                        transport = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, transport.exchange(Buffer.from(req.body.apduHex, "hex"))];
                    case 4:
                        data = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        transport.close();
                        if (saveToFile) {
                            fs_1["default"].writeFileSync(saveToFile, recordStore.toString());
                        }
                        else if (recordStore) {
                            if (recordStore.isEmpty()) {
                                process.exit(0);
                            }
                        }
                        return [7 /*endfinally*/];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        error = e_1.toString();
                        return [3 /*break*/, 8];
                    case 8:
                        pending = false;
                        result = {
                            data: data,
                            error: error
                        };
                        if (data) {
                            //  @ts-expect-error 3 args only, we give 5
                            (0, logs_1.log)("proxy", "HTTP:", req.body.apduHex, "=>", data.toString("hex"));
                        }
                        else {
                            //  @ts-expect-error 3 args only, we give 5
                            (0, logs_1.log)("proxy", "HTTP:", req.body.apduHex, "=>", error);
                        }
                        res.json(result);
                        if (error && error.name === "RecordStoreWrongAPDU") {
                            console.error(error.message);
                            process.exit(1);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        var wsIndex = 0;
        var wsBusyIndex = 0;
        wss.on("connection", function (ws) {
            var index = ++wsIndex;
            try {
                var transport_1;
                var transportP_1;
                var destroyed_1 = false;
                var onClose = function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (destroyed_1)
                                    return [2 /*return*/];
                                destroyed_1 = true;
                                if (!(wsBusyIndex === index)) return [3 /*break*/, 2];
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): close"));
                                return [4 /*yield*/, transportP_1.then(function (t) { return t.close(); }, function () { })];
                            case 1:
                                _a.sent();
                                wsBusyIndex = 0;
                                _a.label = 2;
                            case 2:
                                if (saveToFile) {
                                    fs_1["default"].writeFileSync(saveToFile, recordStore.toString());
                                }
                                else if (recordStore) {
                                    if (recordStore.isEmpty()) {
                                        process.exit(0);
                                    }
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                ws.on("close", onClose);
                ws.on("message", function (apduHex) { return __awaiter(void 0, void 0, void 0, function () {
                    var e_2, res, e_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (destroyed_1)
                                    return [2 /*return*/];
                                if (!(apduHex === "open")) return [3 /*break*/, 5];
                                if (wsBusyIndex) {
                                    ws.send(JSON.stringify({
                                        error: "WebSocket is busy (previous session not closed)"
                                    }));
                                    ws.close();
                                    destroyed_1 = true;
                                    return [2 /*return*/];
                                }
                                transportP_1 = Transport.open();
                                wsBusyIndex = index;
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): opening..."));
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, transportP_1];
                            case 2:
                                transport_1 = _a.sent();
                                transport_1.on("disconnect", function () { return ws.close(); });
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): opened!"));
                                ws.send(JSON.stringify({
                                    type: "opened"
                                }));
                                return [3 /*break*/, 4];
                            case 3:
                                e_2 = _a.sent();
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): open failed! ").concat(e_2));
                                ws.send(JSON.stringify({
                                    error: e_2.message
                                }));
                                ws.close();
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                            case 5:
                                if (wsBusyIndex !== index) {
                                    console.warn("ignoring message because busy transport");
                                    return [2 /*return*/];
                                }
                                if (!transport_1) {
                                    console.warn("received message before device was opened");
                                    return [2 /*return*/];
                                }
                                _a.label = 6;
                            case 6:
                                _a.trys.push([6, 8, , 9]);
                                return [4 /*yield*/, transport_1.exchange(Buffer.from(apduHex, "hex"))];
                            case 7:
                                res = _a.sent();
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): ").concat(apduHex, " => ").concat(res.toString("hex")));
                                if (destroyed_1)
                                    return [2 /*return*/];
                                ws.send(JSON.stringify({
                                    type: "response",
                                    data: res.toString("hex")
                                }));
                                return [3 /*break*/, 9];
                            case 8:
                                e_3 = _a.sent();
                                (0, logs_1.log)("proxy", "WS(".concat(index, "): ").concat(apduHex, " =>"), e_3);
                                if (destroyed_1)
                                    return [2 /*return*/];
                                ws.send(JSON.stringify({
                                    type: "error",
                                    error: e_3.message
                                }));
                                if (e_3.name === "RecordStoreWrongAPDU") {
                                    console.error(e_3.message);
                                    process.exit(1);
                                }
                                return [3 /*break*/, 9];
                            case 9: return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (e) {
                ws.close();
            }
        });
        __spreadArray(["localhost"], __read(ips), false).map(function (ip) { return "ws://".concat(ip, ":").concat(PORT); })
            .forEach(function (ip) {
            (0, logs_1.log)("proxy", "DEVICE_PROXY_URL=" + ip);
        });
        server.listen(PORT, function () {
            (0, logs_1.log)("proxy", "\nNano S proxy started on ".concat(ips[0], "\n"));
        });
        return function () {
            unsub();
        };
    });
};
exports["default"] = {
    args: args,
    job: job
};
//# sourceMappingURL=proxy.js.map