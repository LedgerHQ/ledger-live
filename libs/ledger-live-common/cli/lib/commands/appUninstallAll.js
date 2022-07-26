"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var apps_1 = require("@ledgerhq/live-common/lib/apps");
var hw_1 = require("@ledgerhq/live-common/lib/apps/hw");
var scan_1 = require("../scan");
exports["default"] = {
    description: "uninstall all apps in the device",
    args: [scan_1.deviceOpt],
    job: function (_a) {
        var device = _a.device;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            var exec = (0, hw_1.execWithTransport)(t);
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) {
                return (0, hw_1.listApps)(t, deviceInfo).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), (0, operators_1.map)(function (e) {
                    return (0, apps_1.reducer)(e.result, {
                        type: "wipe"
                    });
                }, exec), (0, operators_1.mergeMap)(function (s) { return (0, apps_1.runAll)(s, exec); }));
            }));
        });
    }
};
//# sourceMappingURL=appUninstallAll.js.map