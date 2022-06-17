"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
var operators_1 = require("rxjs/operators");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var logic_1 = require("@ledgerhq/live-common/lib/compound/logic");
var scan_1 = require("../scan");
var formatDate = function (date) {
    var ye = new Intl.DateTimeFormat("en", {
        year: "numeric"
    }).format(date);
    var mo = new Intl.DateTimeFormat("en", {
        month: "short"
    }).format(date);
    var da = new Intl.DateTimeFormat("en", {
        day: "2-digit"
    }).format(date);
    return "".concat(da, "-").concat(mo, "-").concat(ye);
};
var createLoanHeader = function (summary, strings, account, parentAccount) {
    var totalSupplied = summary.totalSupplied, allTimeEarned = summary.allTimeEarned, status = summary.status;
    strings.push("\n");
    strings.push("Compound Summary for account ".concat(parentAccount ? parentAccount.id : account ? account.id : ""));
    strings.push("\n");
    if (status) {
        strings.push("Status: ".concat(status));
        strings.push("\n");
    }
    strings.push("-------------------------------");
    strings.push("\n");
    strings.push("".concat(account.token.ticker, " supplied").padStart(16));
    strings.push(" | ");
    strings.push("".concat(account.token.ticker, " earned").padStart(16));
    strings.push(" | ");
    strings.push("\n");
    strings.push("".concat((0, currencies_1.formatCurrencyUnit)(account.token.units[0], totalSupplied)).padStart(16));
    strings.push(" | ");
    strings.push("".concat((0, currencies_1.formatCurrencyUnit)(account.token.units[0], allTimeEarned)).padStart(16));
    strings.push(" | ");
    strings.push("\n");
    strings.push("-------------------------------");
    strings.push("\n");
    return strings;
};
var createLoanDisplay = function (loans, strings, title, account) {
    strings.push(title);
    strings.push("\n");
    strings.push("Starting Date".padStart(16));
    strings.push(" | ");
    strings.push("Ending Date".padStart(16));
    strings.push(" | ");
    strings.push("".concat(account.token.ticker).padStart(16));
    strings.push(" | ");
    strings.push("".concat(account.token.ticker, " Earned").padStart(16));
    strings.push(" | ");
    strings.push("Interests Accrued (%)".padStart(22));
    strings.push(" | ");
    strings.push("\n");
    loans.forEach(function (_a) {
        var startingDate = _a.startingDate, 
        // @ts-expect-error composite type, endDate doesn't exist on one subtype
        endDate = _a.endDate, amountSupplied = _a.amountSupplied, interestsEarned = _a.interestsEarned, percentageEarned = _a.percentageEarned;
        strings.push(formatDate(startingDate).padStart(16));
        strings.push(" | ");
        strings.push((endDate ? formatDate(endDate) : "-").padStart(16));
        strings.push(" | ");
        strings.push("".concat((0, currencies_1.formatCurrencyUnit)(account.token.units[0], amountSupplied)).padStart(16));
        strings.push(" | ");
        strings.push("".concat((0, currencies_1.formatCurrencyUnit)(account.token.units[0], interestsEarned)).padStart(16));
        strings.push(" | ");
        strings.push("".concat(Math.round(percentageEarned * 100) / 100).padStart(22));
        strings.push(" | ");
        strings.push("\n");
    });
    strings.push("-------------------------------");
    strings.push("\n");
    return strings;
};
var compoundSummaryFormatter = {
    summary: function (summary) {
        if (!summary)
            return "";
        var account = summary.account, totalSupplied = summary.totalSupplied, allTimeEarned = summary.allTimeEarned, accruedInterests = summary.accruedInterests, opened = summary.opened, closed = summary.closed;
        return JSON.stringify({
            accountId: account.id,
            totalSupplied: totalSupplied.toString(),
            allTimeEarned: allTimeEarned.toString(),
            accruedInterests: accruedInterests.toString(),
            opened: opened.map(function (_a) {
                var op = __rest(_a, []);
                return ({
                    startingDate: op.startingDate.toString(),
                    interestsEarned: op.interestsEarned.toString(),
                    amountSupplied: op.amountSupplied.toString(),
                    percentageEarned: op.percentageEarned.toString()
                });
            }),
            closed: closed.map(function (_a) {
                var op = __rest(_a, []);
                return ({
                    startingDate: op.startingDate.toString(),
                    amountSupplied: op.amountSupplied.toString(),
                    interestsEarned: op.interestsEarned.toString(),
                    percentageEarned: op.percentageEarned.toString()
                });
            })
        });
    },
    "default": function (summary) {
        var opened = summary.opened, closed = summary.closed, account = summary.account, parentAccount = summary.parentAccount;
        if (opened.length === 0 && closed.length === 0)
            return "";
        if (account.type !== "TokenAccount")
            return "";
        var strings = [];
        createLoanHeader(summary, strings, account, parentAccount);
        createLoanDisplay(opened, strings, "OPENED LOANS", account);
        createLoanDisplay(closed, strings, "CLOSED LOANS", account);
        return strings.join("");
    }
};
exports["default"] = {
    description: "Create a summary of compound operations (ETH)",
    args: __spreadArray(__spreadArray([], __read(scan_1.scanCommonOpts), false), [
        {
            name: "format",
            alias: "f",
            type: String,
            typeDesc: Object.keys(compoundSummaryFormatter).join(" | "),
            desc: "how to display the data"
        },
    ], false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.map)(function (account) {
            var _a;
            var result = [];
            if (!((_a = account === null || account === void 0 ? void 0 : account.subAccounts) === null || _a === void 0 ? void 0 : _a.length))
                return "";
            var formatter = compoundSummaryFormatter[opts.format || "default"];
            account.subAccounts.forEach(function (s) {
                if (s.type !== "TokenAccount")
                    return;
                if (!(0, currencies_1.findCompoundToken)(s.token))
                    return;
                var sum = (0, logic_1.makeCompoundSummaryForAccount)(s, account);
                if (!sum)
                    return;
                var summary = formatter(sum);
                result.push(summary);
            });
            return result.join("");
        }));
    }
};
//# sourceMappingURL=makeCompoundSummary.js.map