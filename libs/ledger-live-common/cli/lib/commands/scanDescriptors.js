"use strict";
exports.__esModule = true;
var scan_1 = require("../scan");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var descriptor_1 = require("@ledgerhq/live-common/lib/families/bitcoin/descriptor");
function requiredCurrency(c) {
    if (!c)
        throw new Error("could not find currency");
    return c;
}
exports["default"] = {
    description: "Synchronize accounts with blockchain",
    args: [scan_1.deviceOpt, scan_1.currencyOpt],
    job: function (opts) {
        return (0, descriptor_1.scanDescriptors)(opts.device || "", requiredCurrency((0, currencies_1.findCryptoCurrencyByKeyword)(opts.currency || "bitcoin")));
    }
};
//# sourceMappingURL=scanDescriptors.js.map