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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var manager_1 = __importDefault(require("@ledgerhq/live-common/lib/manager"));
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var openApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/openApp"));
var quitApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/quitApp"));
var installApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/installApp"));
var uninstallApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/uninstallApp"));
var scan_1 = require("../scan");
exports["default"] = {
    description: "Manage Ledger device's apps",
    args: [
        scan_1.deviceOpt,
        {
            name: "verbose",
            alias: "v",
            type: Boolean,
            desc: "enable verbose logs"
        },
        {
            name: "install",
            alias: "i",
            type: String,
            desc: "install an application by its name",
            multiple: true
        },
        {
            name: "uninstall",
            alias: "u",
            type: String,
            desc: "uninstall an application by its name",
            multiple: true
        },
        {
            name: "open",
            alias: "o",
            type: String,
            desc: "open an application by its display name"
        },
        {
            name: "debug",
            type: String,
            desc: "get information of an application by its name"
        },
        {
            name: "quit",
            alias: "q",
            type: Boolean,
            desc: "close current application"
        },
    ],
    job: function (_a) {
        var device = _a.device, verbose = _a.verbose, install = _a.install, uninstall = _a.uninstall, open = _a.open, quit = _a.quit, debug = _a.debug;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            if (quit)
                return (0, rxjs_1.from)((0, quitApp_1["default"])(t));
            if (open)
                return (0, rxjs_1.from)((0, openApp_1["default"])(t, (0, scan_1.inferManagerApp)(open)));
            if (debug)
                return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) {
                    return (0, rxjs_1.from)(manager_1["default"].getAppsList(deviceInfo, true)).pipe((0, operators_1.mergeMap)(function (list) {
                        var app = list.find(function (item) {
                            return item.name.toLowerCase() ===
                                (0, scan_1.inferManagerApp)(debug).toLowerCase();
                        });
                        if (!app) {
                            throw new Error("application '" + debug + "' not found");
                        }
                        return [app];
                    }));
                }));
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) {
                return (0, rxjs_1.from)(manager_1["default"].getAppsList(deviceInfo, true)).pipe((0, operators_1.mergeMap)(function (list) {
                    return rxjs_1.concat.apply(void 0, __spreadArray(__spreadArray([], __read((uninstall || []).map(function (application) {
                        var targetId = deviceInfo.targetId;
                        var app = list.find(function (item) {
                            return item.name.toLowerCase() ===
                                (0, scan_1.inferManagerApp)(application).toLowerCase();
                        });
                        if (!app) {
                            throw new Error("application '" + application + "' not found");
                        }
                        return (0, uninstallApp_1["default"])(t, targetId, app);
                    })), false), __read((install || []).map(function (application) {
                        var targetId = deviceInfo.targetId;
                        var app = list.find(function (item) {
                            return item.name.toLowerCase() ===
                                (0, scan_1.inferManagerApp)(application).toLowerCase();
                        });
                        if (!app) {
                            throw new Error("application '" + application + "' not found");
                        }
                        return (0, installApp_1["default"])(t, targetId, app);
                    })), false));
                }));
            }), verbose ? (0, operators_1.map)(function (a) { return a; }) : (0, operators_1.ignoreElements)());
        });
    }
};
//# sourceMappingURL=app.js.map