"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var env_1 = require("@ledgerhq/live-common/lib/env");
exports["default"] = {
    description: "Print available environment variables",
    args: [],
    job: function () {
        return (0, rxjs_1.from)((0, env_1.getAllEnvNames)()).pipe((0, operators_1.map)(function (name) {
            return "# ".concat(name, " ").concat((0, env_1.getEnvDesc)(name), "\n").concat(name, "=").concat(JSON.stringify((0, env_1.getEnv)(name)), "\n");
        }));
    }
};
//# sourceMappingURL=envs.js.map