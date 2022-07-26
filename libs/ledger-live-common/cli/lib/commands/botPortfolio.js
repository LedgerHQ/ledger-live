"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var account_1 = require("@ledgerhq/live-common/lib/account");
var blacklist = ["decred", "tezos", "stellar", "ethereum_classic"];
exports["default"] = {
    description: "Use speculos and a list of supported coins to retrieve all accounts",
    args: [
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(account_1.accountFormatters).join(" | "),
            desc: "how to display the data"
        },
    ],
    job: function (opts) {
        return (0, rxjs_1.from)((0, currencies_1.listSupportedCurrencies)()).pipe((0, operators_1.filter)(function (c) { return !blacklist.includes(c.id) && !c.isTestnetFor; }), (0, operators_1.map)(function (currency) {
            return (0, rxjs_1.defer)(function () {
                return (0, bridge_1.getCurrencyBridge)(currency)
                    .scanAccounts({
                    currency: currency,
                    deviceId: "speculos:nanos:".concat(currency.id),
                    syncConfig: {
                        paginationConfig: {}
                    }
                })
                    .pipe((0, operators_1.timeoutWith)(200 * 1000, (0, rxjs_1.throwError)(new Error("scan account timeout"))), (0, operators_1.catchError)(function (e) {
                    console.error("scan accounts failed for " + currency.id, e);
                    return (0, rxjs_1.from)([]);
                }));
            });
        }), (0, operators_1.mergeAll)(5), (0, operators_1.filter)(function (e) { return e.type === "discovered"; }), (0, operators_1.map)(function (e) {
            return (account_1.accountFormatters[opts.format] || account_1.accountFormatters["default"])(e.account);
        }));
    }
};
//# sourceMappingURL=botPortfolio.js.map