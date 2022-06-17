"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getAppAndVersion_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getAppAndVersion"));
var scan_1 = require("../scan");
exports["default"] = {
    args: [scan_1.deviceOpt],
    job: function (_a) {
        var device = _a.device;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) { return (0, rxjs_1.from)((0, getAppAndVersion_1["default"])(t)); });
    }
};
//# sourceMappingURL=deviceAppVersion.js.map