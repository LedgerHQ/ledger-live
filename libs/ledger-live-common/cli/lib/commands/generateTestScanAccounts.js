"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var logs_1 = require("@ledgerhq/logs");
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var scan_1 = require("../scan");
exports["default"] = {
    description: "Generate a test for scan accounts (live-common dataset)",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(account_1.accountFormatters).join(" | "),
            desc: "how to display the data"
        },
    ], false),
    job: function (opts) {
        if (!opts.currency)
            throw new Error("-c currency is missing");
        var apdus = [];
        (0, logs_1.listen)(function (log) {
            if (log.type === "apdu" && log.message) {
                apdus.push(log.message);
            }
        });
        return (0, scan_1.scan)(opts).pipe((0, operators_1.reduce)(function (all, a) { return all.concat(a); }, []), (0, operators_1.map)(function (accounts) {
            if (accounts.length === 0)
                throw new Error("no accounts!");
            var currency = accounts[0].currency;
            return "\nimport type { CurrenciesData } from \"../../../types\";\nimport type { Transaction } from \"../types\";\n\nconst dataset: CurrenciesData<Transaction> = {\n  scanAccounts: [\n    {\n      name: \"".concat(currency.id, " seed 1\",\n      apdus: `\n").concat(apdus.map(function (a) { return "      " + a; }).join("\n"), "\n      `,\n    },\n  ],\n};\n\nexport default dataset;\n");
        }));
    }
};
//# sourceMappingURL=generateTestScanAccounts.js.map