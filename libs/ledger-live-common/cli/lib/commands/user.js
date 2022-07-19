"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var user_1 = require("@ledgerhq/live-common/lib/user");
exports["default"] = {
    args: [],
    job: function () { return (0, rxjs_1.concat)((0, rxjs_1.of)(JSON.stringify((0, user_1.getUserHashes)()))); }
};
//# sourceMappingURL=user.js.map