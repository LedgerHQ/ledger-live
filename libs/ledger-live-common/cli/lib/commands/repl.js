"use strict";
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var scan_1 = require("../scan");
var stream_1 = require("../stream");
exports["default"] = {
    description: "Low level exchange with the device. Send APDUs from stdin.",
    args: [
        scan_1.deviceOpt,
        {
            name: "file",
            alias: "f",
            type: String,
            typeDesc: "filename",
            desc: "A file can also be provided. By default stdin is used."
        },
    ],
    job: function (_a) {
        var device = _a.device, file = _a.file;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            return (0, stream_1.apdusFromFile)(file || "-").pipe((0, operators_1.concatMap)(function (apdu) { return t.exchange(apdu); }));
        }).pipe((0, operators_1.map)(function (res) { return res.toString("hex"); }));
    }
};
//# sourceMappingURL=repl.js.map