"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var derivation_1 = require("@ledgerhq/live-common/lib/derivation");
var env_1 = require("@ledgerhq/live-common/lib/env");
var account_1 = require("@ledgerhq/live-common/lib/account");
exports["default"] = {
    args: [],
    job: function () {
        return (0, rxjs_1.of)((0, currencies_1.listSupportedCurrencies)()
            .map(function (currency) {
            var value = (0, env_1.getEnv)("SCAN_FOR_INVALID_PATHS");
            (0, env_1.setEnv)("SCAN_FOR_INVALID_PATHS", true);
            var modes = (0, derivation_1.getDerivationModesForCurrency)(currency);
            (0, env_1.setEnv)("SCAN_FOR_INVALID_PATHS", value);
            return modes
                .map(function (derivationMode) {
                var scheme = (0, derivation_1.getDerivationScheme)({
                    derivationMode: derivationMode,
                    currency: currency
                });
                var path = (0, derivation_1.runDerivationScheme)(scheme, currency, {
                    account: "<account>",
                    node: "<change>",
                    address: "<address>"
                });
                return ("  " +
                    (derivationMode || "default") +
                    ": " +
                    (0, account_1.getAccountPlaceholderName)({
                        currency: currency,
                        index: 0,
                        derivationMode: derivationMode
                    }) +
                    ": " +
                    path);
            })
                .join("\n");
        })
            .join("\n"));
    }
};
//# sourceMappingURL=derivation.js.map