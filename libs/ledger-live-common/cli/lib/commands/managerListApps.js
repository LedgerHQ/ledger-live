"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var hw_1 = require("@ledgerhq/live-common/lib/apps/hw");
var scan_1 = require("../scan");
exports["default"] = {
    description: "List apps that can be installed on the device",
    args: [
        scan_1.deviceOpt,
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: "raw | json | default"
        },
    ],
    job: function (_a) {
        var device = _a.device, format = _a.format;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) {
                return (0, hw_1.listApps)(t, deviceInfo).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), 
                // @ts-expect-error we need better typings and safe guard to infer types
                (0, operators_1.map)(function (e) { return e.result; }));
            }), (0, operators_1.map)(function (r) {
                return format === "raw"
                    ? r
                    : format === "json"
                        ? JSON.stringify(r)
                        : r.appsListNames
                            .map(function (name) {
                            var item = r.appByName[name];
                            var ins = r.installed.find(function (i) { return i.name === item.name; });
                            return ("- ".concat(item.name, " ").concat(item.version) +
                                (ins ? (ins.updated ? " (installed)" : " (outdated!)") : ""));
                        })
                            .join("\n");
            }));
        });
    }
};
//# sourceMappingURL=managerListApps.js.map