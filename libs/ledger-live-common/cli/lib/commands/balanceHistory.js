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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var bignumber_js_1 = require("bignumber.js");
var asciichart_1 = __importDefault(require("asciichart"));
var invariant_1 = __importDefault(require("invariant"));
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var v2_1 = require("@ledgerhq/live-common/lib/portfolio/v2");
var range_1 = require("@ledgerhq/live-common/lib/portfolio/v2/range");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var scan_1 = require("../scan");
var histoFormatters = {
    "default": function (histo, account) {
        return histo
            .map(function (_a) {
            var date = _a.date, value = _a.value;
            return date.toISOString() +
                " " +
                (0, currencies_1.formatCurrencyUnit)(account.unit, new bignumber_js_1.BigNumber(value), {
                    showCode: true,
                    disableRounding: true
                });
        })
            .join("\n");
    },
    json: function (histo) { return (0, account_1.toBalanceHistoryRaw)(histo); },
    asciichart: function (history, account) {
        return "\n" +
            "".padStart(22) +
            account.name +
            ": " +
            (0, currencies_1.formatCurrencyUnit)(account.unit, account.balance, {
                showCode: true,
                disableRounding: true
            }) +
            "\n" +
            asciichart_1["default"].plot(history.map(function (h) {
                return h.value.div(new bignumber_js_1.BigNumber(10).pow(account.unit.magnitude)).toNumber();
            }), {
                height: 10,
                format: function (value) {
                    return (0, currencies_1.formatCurrencyUnit)(account.unit, new bignumber_js_1.BigNumber(value).times(new bignumber_js_1.BigNumber(10).pow(account.unit.magnitude)), {
                        showCode: true,
                        disableRounding: true
                    }).padStart(20);
                }
            });
    }
};
function asPortfolioRange(period) {
    var ranges = (0, range_1.getRanges)();
    (0, invariant_1["default"])(ranges.includes(period), "invalid period. valid values are %s", ranges.join(" | "));
    return period;
}
exports["default"] = {
    description: "Get the balance history for accounts",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "period",
            alias: "p",
            type: String,
            desc: (0, range_1.getRanges)().join(" | ")
        },
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(histoFormatters).join(" | "),
            desc: "how to display the data"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.map)(function (account) {
            var range = asPortfolioRange(opts.period || "month");
            var count = (0, v2_1.getPortfolioCount)([account], range);
            var histo = (0, v2_1.getBalanceHistory)(account, range, count);
            var format = histoFormatters[opts.format || "default"];
            return format(histo, account);
        }));
    }
};
//# sourceMappingURL=balanceHistory.js.map