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
var invariant_1 = __importDefault(require("invariant"));
var fs_1 = __importDefault(require("fs"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var Manager_1 = __importDefault(require("@ledgerhq/live-common/lib/api/Manager"));
var network_1 = __importDefault(require("@ledgerhq/live-common/lib/network"));
var installApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/installApp"));
var uninstallApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/uninstallApp"));
var apps_1 = require("@ledgerhq/live-common/lib/apps");
var hw_1 = require("@ledgerhq/live-common/lib/apps/hw");
var promise_1 = require("@ledgerhq/live-common/lib/promise");
var env_1 = require("@ledgerhq/live-common/lib/env");
var polyfill_1 = require("@ledgerhq/live-common/lib/apps/polyfill");
var scan_1 = require("../scan");
var blacklistApps = ["Fido U2F"];
var MemoFile = /** @class */ (function () {
    function MemoFile(file) {
        this.file = file;
    }
    MemoFile.prototype.readResults = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fs_1["default"].readFile(_this.file, "utf8", function (err, data) {
                if (err)
                    return reject(err);
                resolve(data
                    .split("\n")
                    .map(function (line) {
                    var _a = __read(line
                        .split(":")
                        .map(function (s) { return s.trim(); })), versionIdStr = _a[0], appPath = _a[1], status = _a[2], rest = _a.slice(3);
                    var error = rest.join(": ");
                    var versionId = parseInt(versionIdStr, 10);
                    if (isNaN(versionId) || !isFinite(versionId) || versionId <= 0) {
                        return;
                    }
                    if (versionId && appPath) {
                        if (status === "OK") {
                            return {
                                versionId: versionId,
                                appPath: appPath,
                                status: "OK"
                            };
                        }
                        else if (status === "KO" && typeof error === "string") {
                            return {
                                versionId: versionId,
                                appPath: appPath,
                                status: "KO",
                                error: error
                            };
                        }
                    }
                })
                    .filter(Boolean));
            });
        });
    };
    MemoFile.prototype.writeResults = function (results) {
        var _this = this;
        var data = results
            .slice(0)
            .sort(function (a, b) {
            return 1000000 * a.status.localeCompare(b.status) +
                100000 * a.appPath.localeCompare(b.appPath) +
                (a.versionId - b.versionId);
        })
            .map(function (result) {
            return [
                result.versionId,
                result.appPath,
                result.status,
                result.status === "KO" ? result.error : "",
            ].join(": ");
        })
            .join("\n");
        return new Promise(function (resolve, reject) {
            fs_1["default"].writeFile(_this.file, data, "utf8", function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    };
    return MemoFile;
}());
var results = [];
var memoFile;
var getAPIDeviceVersionIds = function (deviceInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var targetId, data, all, data_1, data_1_1, device, _a, _b, deviceVersion;
    var e_1, _c, e_2, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                targetId = String(deviceInfo.targetId);
                return [4 /*yield*/, (0, network_1["default"])({
                        method: "GET",
                        url: "".concat((0, env_1.getEnv)("MANAGER_API_BASE"), "/devices")
                    })];
            case 1:
                data = (_e.sent()).data;
                all = [];
                try {
                    for (data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
                        device = data_1_1.value;
                        try {
                            for (_a = (e_2 = void 0, __values(device.device_versions)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                deviceVersion = _b.value;
                                if (deviceVersion.target_id === targetId) {
                                    all.push(deviceVersion.id);
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_d = _a["return"])) _d.call(_a);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (data_1_1 && !data_1_1.done && (_c = data_1["return"])) _c.call(data_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return [2 /*return*/, all];
        }
    });
}); };
var compatibleAppVersion = function (v, deviceVersionIds, deviceModel, deviceInfo) {
    return v.providers.includes(1) &&
        deviceVersionIds.some(function (id) { return v.device_versions.includes(id); }) && // heuristic to see if app is compatible...
        v.firmware.startsWith(deviceModel.id.toLowerCase() + "/" + deviceInfo.version);
};
var findCandidates = function (deviceModel, applications, deviceInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var deviceVersionIds, candidates;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(deviceInfo);
                return [4 /*yield*/, getAPIDeviceVersionIds(deviceInfo)];
            case 1:
                deviceVersionIds = _a.sent();
                if (!deviceVersionIds.length)
                    throw new Error("unknown device version plugged");
                candidates = applications
                    .filter(function (a) { return !blacklistApps.includes(a.name); })
                    .flatMap(function (app) {
                    var deps = (0, polyfill_1.getDependencies)(app.name);
                    return app.application_versions
                        .filter(function (v) {
                        return compatibleAppVersion(v, deviceVersionIds, deviceModel, deviceInfo);
                    })
                        .map(function (version) {
                        return {
                            app: app,
                            version: version,
                            installQueue: __spreadArray(__spreadArray([], __read(deps
                                .map(function (name) {
                                var depApp = applications.find(function (a) { return a.name === name; });
                                return depApp
                                    ? depApp.application_versions.find(function (v) {
                                        return compatibleAppVersion(v, deviceVersionIds, deviceModel, deviceInfo) && v.version === version.version;
                                    })
                                    : null;
                            })
                                .filter(Boolean)), false), [
                                version,
                            ], false)
                        };
                    });
                });
                if (process.env.RANDOM_APPS_ORDER) {
                    candidates.sort(function () { return Math.random() - 0.5; });
                }
                return [2 /*return*/, candidates];
        }
    });
}); };
var installCandidate = function (t, deviceInfo, candidate) {
    return rxjs_1.concat.apply(void 0, __spreadArray([], __read(candidate.installQueue.flatMap(function (app) { return [
        (0, rxjs_1.defer)(function () { return (0, promise_1.delay)((0, env_1.getEnv)("MANAGER_INSTALL_DELAY")); }),
        (0, rxjs_1.defer)(function () { return (0, installApp_1["default"])(t, deviceInfo.targetId, app); }),
    ]; })), false));
};
var uninstallCandidate = function (t, deviceInfo, candidate) {
    return rxjs_1.concat.apply(void 0, __spreadArray([], __read(candidate.installQueue
        .slice(0)
        .reverse()
        .flatMap(function (app) { return [
        (0, rxjs_1.defer)(function () { return (0, promise_1.delay)((0, env_1.getEnv)("MANAGER_INSTALL_DELAY")); }),
        (0, rxjs_1.defer)(function () { return (0, uninstallApp_1["default"])(t, deviceInfo.targetId, app); }),
    ]; })), false));
};
var getCandidateName = function (candidate) {
    return (candidate.version.name +
        " " +
        candidate.version.version +
        " (" +
        candidate.version.firmware +
        ")");
};
var lastResult;
var checkInstalled = function (installed, candidate) {
    var name = getCandidateName(candidate);
    var ins = installed.find(function (i) {
        return i.name === candidate.version.name || i.hash === candidate.version.hash;
    });
    var result;
    if (!ins) {
        if (installed.length > 0) {
            var message = " list apps don't find installed app? Found these: " +
                JSON.stringify(installed);
            result = {
                versionId: candidate.version.id,
                appPath: candidate.version.firmware,
                status: "KO",
                error: message
            };
            if (lastResult &&
                lastResult.versionId === result.versionId &&
                lastResult.status === "KO") {
                result.error += " – " + lastResult.error;
            }
            console.error("FAIL " + name + message);
        }
        else {
            console.error("FAIL " + name + " was not correctly installed");
            return rxjs_1.EMPTY;
        }
    }
    else {
        var hashMatches = ins.hash === candidate.version.hash;
        var hasBytes = !!candidate.version.bytes;
        if (hashMatches && hasBytes) {
            result = {
                versionId: candidate.version.id,
                appPath: candidate.version.firmware,
                status: "OK"
            };
            console.log("OK " + name);
        }
        else {
            var message = (hashMatches
                ? ""
                : " have BAD HASH. API have " +
                    candidate.version.hash +
                    " but device have " +
                    ins.hash) + (hasBytes ? "" : " DOES NOT have bytes defined!");
            result = {
                versionId: candidate.version.id,
                appPath: candidate.version.firmware,
                status: "KO",
                error: message
            };
            console.error("FAIL " + name + message);
        }
    }
    results = results
        .filter(function (r) { return r.versionId !== result.versionId; })
        .concat(result);
    if (memoFile) {
        return (0, rxjs_1.from)(memoFile.writeResults(results)).pipe((0, operators_1.ignoreElements)());
    }
    return rxjs_1.EMPTY;
};
var wipeAll = function (t, deviceInfo) {
    return (0, hw_1.listApps)(t, deviceInfo).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), (0, operators_1.map)(function (e) { return e.result; }), (0, operators_1.mergeMap)(function (listAppsResult) {
        var exec = (0, hw_1.execWithTransport)(t);
        var s = (0, apps_1.initState)(listAppsResult);
        s = (0, apps_1.reducer)(s, {
            type: "wipe"
        });
        if (s.uninstallQueue.length) {
            console.log("Uninstall " + s.uninstallQueue.length + " app(s)");
        }
        return (0, apps_1.runAll)(s, exec);
    }));
};
exports["default"] = {
    description: "install/uninstall all possible apps available on our API to check all is good (even old app versions)",
    args: [
        scan_1.deviceOpt,
        {
            name: "memo",
            alias: "m",
            desc: "a file to memorize the previously saved result so we don't run again from the start"
        },
    ],
    job: function (_a) {
        var device = _a.device, memo = _a.memo;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            return (0, rxjs_1.from)(Promise.all([(0, getDeviceInfo_1["default"])(t), Manager_1["default"].listApps()]).then(function (_a) {
                var _b = __read(_a, 2), deviceInfo = _b[0], applications = _b[1];
                return __awaiter(void 0, void 0, void 0, function () {
                    var deviceModel, candidates, candidatesErrors, candidatesNew, all;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                deviceModel = t.deviceModel;
                                (0, invariant_1["default"])(deviceModel, "device model mandatory");
                                return [4 /*yield*/, findCandidates(deviceModel, applications, deviceInfo)];
                            case 1:
                                candidates = _c.sent();
                                candidatesErrors = [];
                                candidatesNew = __spreadArray([], __read(candidates), false);
                                if (!memo) return [3 /*break*/, 3];
                                memoFile = new MemoFile(memo);
                                return [4 /*yield*/, memoFile.readResults()];
                            case 2:
                                results = _c.sent();
                                candidatesErrors = [];
                                candidatesNew = [];
                                candidates.forEach(function (c) {
                                    var result = results.find(function (r) { return r.versionId === c.version.id; });
                                    if (process.env.VERBOSE_CANDIDATE) {
                                        console.log(c.version.id, c.version.firmware, result
                                            ? "result was " +
                                                result.status +
                                                (result.status === "KO" ? " " + result.error : "")
                                            : "");
                                    }
                                    if (result) {
                                        if (result.status === "KO") {
                                            candidatesErrors.push(c);
                                        }
                                    }
                                    else {
                                        candidatesNew.push(c);
                                    }
                                });
                                _c.label = 3;
                            case 3:
                                all = __spreadArray(__spreadArray([], __read(candidatesNew), false), __read(candidatesErrors), false);
                                if (candidates.length) {
                                    console.log(((100 * (candidates.length - candidatesNew.length)) /
                                        candidates.length).toFixed(0) +
                                        "% of apps versions tested. (" +
                                        candidates.length +
                                        " in total. " +
                                        candidatesNew.length +
                                        " new. " +
                                        candidatesErrors.length +
                                        " errors)");
                                }
                                else {
                                    console.log("No apps candidate found");
                                }
                                return [2 /*return*/, [deviceInfo, all]];
                        }
                    });
                });
            })).pipe((0, operators_1.mergeMap)(function (_a) {
                var _b = __read(_a, 2), deviceInfo = _b[0], candidates = _b[1];
                return (0, rxjs_1.concat)(wipeAll(t, deviceInfo).pipe((0, operators_1.ignoreElements)()), (0, rxjs_1.of)([deviceInfo, candidates]));
            }), (0, operators_1.mergeMap)(function (_a) {
                var _b = __read(_a, 2), deviceInfo = _b[0], candidates = _b[1];
                return candidates.reduce(function (acc, candidate) {
                    return (0, rxjs_1.concat)(acc, (0, rxjs_1.defer)(function () {
                        return installCandidate(t, deviceInfo, candidate).pipe((0, operators_1.ignoreElements)(), (0, operators_1.catchError)(function (e) {
                            var result = {
                                versionId: candidate.version.id,
                                appPath: candidate.version.firmware,
                                status: "KO",
                                error: "FAILED installing, got " + String(e.message)
                            };
                            lastResult = result;
                            results = results
                                .filter(function (r) { return r.versionId !== result.versionId; })
                                .concat(result);
                            console.error("FAILED installing " + getCandidateName(candidate), e);
                            if (memoFile) {
                                return (0, rxjs_1.from)(memoFile.writeResults(results)).pipe((0, operators_1.ignoreElements)());
                            }
                            return rxjs_1.EMPTY;
                        }));
                    }), (0, rxjs_1.defer)(function () { return (0, promise_1.delay)(3000); }).pipe((0, operators_1.ignoreElements)()), (0, rxjs_1.defer)(function () {
                        return (0, rxjs_1.from)(new Promise(function (resolve, reject) {
                            Manager_1["default"].listInstalledApps(t, {
                                targetId: deviceInfo.targetId,
                                perso: "perso_11"
                            }).subscribe({
                                next: function (e) {
                                    if (e.type === "result") {
                                        resolve(e.payload);
                                    }
                                },
                                error: reject
                            });
                        })).pipe((0, operators_1.mergeMap)(function (installed) {
                            return (0, rxjs_1.concat)(checkInstalled(installed, candidate), uninstallCandidate(t, deviceInfo, candidate)).pipe((0, operators_1.ignoreElements)());
                        }));
                    }));
                }, rxjs_1.EMPTY);
            }));
        });
    }
};
//# sourceMappingURL=appsCheckAllAppVersions.js.map