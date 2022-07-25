"use strict";
exports.__esModule = true;
/* eslint-disable global-require, @typescript-eslint/no-var-requires */
var rxjs_1 = require("rxjs");
exports["default"] = {
    args: [],
    job: function () {
        return (0, rxjs_1.concat)((0, rxjs_1.of)("ledger-live cli: " + require("../../package.json").version), (0, rxjs_1.of)("@ledgerhq/live-common: " +
            require("@ledgerhq/live-common/package.json").version));
    }
};
//# sourceMappingURL=version.js.map