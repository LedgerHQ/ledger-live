"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var genuineCheck_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/genuineCheck"));
var scan_1 = require("../scan");
exports["default"] = {
    description: "Perform a genuine check with Ledger's HSM",
    args: [scan_1.deviceOpt],
    job: function (_a) {
        var device = _a.device;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe((0, operators_1.mergeMap)(function (deviceInfo) { return (0, genuineCheck_1["default"])(t, deviceInfo); }));
        });
    }
};
//# sourceMappingURL=genuineCheck.js.map