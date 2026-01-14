"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepId = exports.AccountOnboardStatus = void 0;
const types_live_1 = require("@ledgerhq/types-live");
Object.defineProperty(exports, "AccountOnboardStatus", {
  enumerable: true,
  get: function () {
    return types_live_1.AccountOnboardStatus;
  },
});
var StepId;
(function (StepId) {
  StepId["ONBOARD"] = "ONBOARD";
  StepId["FINISH"] = "FINISH";
})(StepId || (exports.StepId = StepId = {}));
//# sourceMappingURL=types.js.map
