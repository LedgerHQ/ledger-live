"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var firmwareUpdate_repair_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/firmwareUpdate-repair"));
var scan_1 = require("../scan");
exports["default"] = {
    description: "Repair a firmware update",
    args: [
        scan_1.deviceOpt,
        {
            name: "forceMCU",
            type: String,
            desc: "force a mcu version to install"
        },
    ],
    job: function (_a) {
        var device = _a.device, forceMCU = _a.forceMCU;
        return (0, firmwareUpdate_repair_1["default"])(device || "", forceMCU);
    }
};
//# sourceMappingURL=firmwareRepair.js.map