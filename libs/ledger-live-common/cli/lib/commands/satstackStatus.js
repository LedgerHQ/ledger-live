"use strict";
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var satstack_1 = require("@ledgerhq/live-common/lib/families/bitcoin/satstack");
var env_1 = require("@ledgerhq/live-common/lib/env");
exports["default"] = {
    description: "Check StackSats status",
    args: [
        {
            name: "continuous",
            type: Boolean,
            desc: "enable status polling"
        },
    ],
    job: function (_a) {
        var continuous = _a.continuous;
        (0, env_1.setEnv)("SATSTACK", true);
        if (!continuous) {
            return satstack_1.statusObservable.pipe((0, operators_1.first)());
        }
        return satstack_1.statusObservable;
    }
};
//# sourceMappingURL=satstackStatus.js.map