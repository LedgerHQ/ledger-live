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
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var apps_1 = require("@ledgerhq/live-common/lib/apps");
var Manager_1 = __importDefault(require("@ledgerhq/live-common/lib/api/Manager"));
var hw_1 = require("@ledgerhq/live-common/lib/apps/hw");
var installApp_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/installApp"));
var scan_1 = require("../scan");
// how to add a scenario:
// wget https://manager.api.live.ledger.com/api/applications
// then find in that json the apps you are looking for (with a provider 1)
// with JS: obj.flatMap(a => a.application_versions).filter(a => a.version==="1.3.16" && a.providers.includes(1))
// array of applicationversion ids
var scenarios = {
    "nanos160-outdated-apps": [1679, 222, 2783, 3295, 3305],
    "nanos160-outdated-bitcoin-apps": [
        3295, 3305, 3319, 3325, 3302, 3324, 3298, 3297, 3318, 3309, 3322, 3304,
        3296, 3308, 3299, 3300, 3312, 3303, 3301, 3315, 3314, 3323,
    ]
};
var scenariosValues = Object.keys(scenarios).join(" | ");
var installScenario = function (apps, transport, deviceInfo, scene) {
    var appVersionsPerId = {};
    apps.forEach(function (a) {
        return a.application_versions.forEach(function (av) {
            appVersionsPerId[av.id] = av;
        });
    });
    return rxjs_1.concat.apply(void 0, __spreadArray([], __read(scene
        .map(function (id) { return appVersionsPerId[id]; })
        .filter(Boolean)
        .map(function (app) {
        return (0, rxjs_1.defer)(function () { return (0, installApp_1["default"])(transport, deviceInfo.targetId, app); });
    })), false));
};
exports["default"] = {
    description: "dev feature to enter into a specific device apps scenario",
    args: [
        scan_1.deviceOpt,
        {
            name: "scenario",
            alias: "s",
            type: String,
            desc: scenariosValues
        },
    ],
    job: function (_a) {
        var device = _a.device, scenario = _a.scenario;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            var scene = scenarios[scenario || ""];
            if (!scene)
                throw new Error("scenario is not found. available --scenario are: " + scenariosValues);
            var exec = (0, hw_1.execWithTransport)(t);
            // $FlowFixMe
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) {
                return (0, hw_1.listApps)(t, deviceInfo).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), (0, operators_1.map)(function (e) { return e.result; }), (0, operators_1.mergeMap)(function (listAppsResult) {
                    var s = (0, apps_1.reducer)((0, apps_1.initState)(listAppsResult), {
                        type: "wipe"
                    });
                    return (0, rxjs_1.concat)((0, apps_1.runAll)(s, exec).pipe((0, operators_1.ignoreElements)()), (0, rxjs_1.from)(Manager_1["default"].listApps()));
                }), (0, operators_1.mergeMap)(function (apps) { return installScenario(apps, t, deviceInfo, scene); }));
            }));
        });
    }
};
//# sourceMappingURL=devDeviceAppsScenario.js.map