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
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var v2_1 = require("@ledgerhq/live-common/lib/portfolio/v2");
var range_1 = require("@ledgerhq/live-common/lib/portfolio/v2/range");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var scan_1 = require("../scan");
var logic_1 = require("@ledgerhq/live-common/lib/countervalues/logic");
function asPortfolioRange(period) {
    var ranges = (0, range_1.getRanges)();
    (0, invariant_1["default"])(ranges.includes(period), "invalid period. valid values are %s", ranges.join(" | "));
    return period;
}
exports["default"] = {
    description: "Get a portfolio summary for accounts",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "countervalue",
            type: String,
            desc: "ticker of a currency"
        },
        {
            name: "period",
            alias: "p",
            type: String,
            desc: (0, range_1.getRanges)().join(" | ")
        },
        {
            name: "disableAutofillGaps",
            alias: "g",
            type: Boolean,
            desc: "if set, disable the autofill of gaps to evaluate the rates availability"
        },
    ], false),
    job: function (opts) {
        var countervalue = (0, currencies_1.findCurrencyByTicker)(opts.countervalue || "USD");
        (0, invariant_1["default"])(countervalue, "currency not found with ticker=" + opts.countervalue);
        return (0, scan_1.scan)(opts).pipe((0, operators_1.reduce)(function (all, a) { return all.concat(a); }, []), (0, operators_1.concatMap)(function (accounts) {
            return (0, rxjs_1.from)((0, logic_1.loadCountervalues)(logic_1.initialState, {
                trackingPairs: (0, logic_1.inferTrackingPairForAccounts)(accounts, countervalue),
                autofillGaps: !opts.disableAutofillGaps
            })).pipe((0, operators_1.map)(function (state) {
                var all = (0, account_1.flattenAccounts)(accounts);
                var period = asPortfolioRange(opts.period || "month");
                var unit = countervalue.units[0];
                function render(title, accounts) {
                    var portfolio = (0, v2_1.getPortfolio)(accounts, period, state, countervalue);
                    var balance = portfolio.balanceHistory[portfolio.balanceHistory.length - 1]
                        .value;
                    return (title +
                        " " +
                        (0, currencies_1.formatCurrencyUnit)(unit, new bignumber_js_1.BigNumber(balance), {
                            showCode: true,
                            disableRounding: true
                        }) +
                        (portfolio.countervalueChange.percentage
                            ? " ::: " +
                                "on a " +
                                period +
                                " period: " +
                                Math.round(portfolio.countervalueChange.percentage * 100).toString() +
                                "% (" +
                                (0, currencies_1.formatCurrencyUnit)(unit, new bignumber_js_1.BigNumber(portfolio.countervalueChange.value), {
                                    showCode: true
                                }) +
                                ")"
                            : "") +
                        "\n" +
                        asciichart_1["default"].plot(portfolio.balanceHistory.map(function (h) {
                            return new bignumber_js_1.BigNumber(h.value)
                                .div(new bignumber_js_1.BigNumber(10).pow(unit.magnitude))
                                .toNumber();
                        }), {
                            height: 10,
                            format: function (value) {
                                return (0, currencies_1.formatCurrencyUnit)(unit, new bignumber_js_1.BigNumber(value).times(new bignumber_js_1.BigNumber(10).pow(unit.magnitude)), {
                                    showCode: true,
                                    disableRounding: true
                                }).padStart(20);
                            }
                        }));
                }
                var str = "";
                accounts.forEach(function (top) {
                    str += render("Account " + (0, account_1.getAccountName)(top), [top]);
                    str += "\n";
                    if (top.subAccounts) {
                        top.subAccounts.forEach(function (sub) {
                            str += render("Account " +
                                (0, account_1.getAccountName)(top) +
                                " > " +
                                (0, account_1.getAccountName)(sub), [sub]).replace(/\n/s, "  \n");
                            str += "\n";
                        });
                    }
                    str += "\n";
                });
                str += "\n";
                str += render("SUMMARY OF PORTFOLIO: " + all.length + " accounts, total of ", accounts);
                return str;
            }));
        }));
    }
};
//# sourceMappingURL=portfolio.js.map