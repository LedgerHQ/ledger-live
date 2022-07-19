"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
require("lodash.product");
// @ts-expect-error product is not inferred we need to extend lodash type
var lodash_1 = require("lodash");
var uniq_1 = __importDefault(require("lodash/uniq"));
var bignumber_js_1 = require("bignumber.js");
var asciichart_1 = __importDefault(require("asciichart"));
var invariant_1 = __importDefault(require("invariant"));
var rxjs_1 = require("rxjs");
var account_1 = require("@ledgerhq/live-common/lib/account");
var v2_1 = require("@ledgerhq/live-common/lib/portfolio/v2");
var range_1 = require("@ledgerhq/live-common/lib/portfolio/v2/range");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var logic_1 = require("@ledgerhq/live-common/lib/countervalues/logic");
var api_1 = __importDefault(require("@ledgerhq/live-common/lib/countervalues/api"));
var histoFormatters = {
    stats: function (histo, currency, countervalue) {
        return (currency.ticker + " to " + countervalue.ticker).padEnd(12) +
            " availability=" +
            ((100 * histo.filter(function (h) { return h.value; }).length) / histo.length).toFixed(0) +
            "%";
    },
    supportedFiats: function (histo, _currency, countervalue) {
        var availability = ((100 * histo.filter(function (h) { return h.value; }).length) /
            histo.length).toFixed(0);
        return availability === "100" ? "\"".concat(countervalue.ticker, "\",") : undefined;
    },
    "default": function (histo, currency, countervalue) {
        return histo
            .map(function (_a) {
            var date = _a.date, value = _a.value;
            return (currency.ticker + "➡" + countervalue.ticker).padEnd(10) +
                " " +
                date.toISOString() +
                " " +
                (0, currencies_1.formatCurrencyUnit)(countervalue.units[0], new bignumber_js_1.BigNumber(value || 0), {
                    showCode: true,
                    disableRounding: true
                });
        })
            .join("\n");
    },
    json: function (histo) { return (0, account_1.toBalanceHistoryRaw)(histo); },
    asciichart: function (history, currency, countervalue) {
        return "\n" +
            "".padStart(22) +
            currency.name +
            " to " +
            countervalue.name +
            "\n" +
            asciichart_1["default"].plot(history.map(function (h) {
                return new bignumber_js_1.BigNumber(h.value || 0)
                    .div(new bignumber_js_1.BigNumber(10).pow(countervalue.units[0].magnitude))
                    .toNumber();
            }), {
                height: 10,
                format: function (value) {
                    return (0, currencies_1.formatCurrencyUnit)(countervalue.units[0], new bignumber_js_1.BigNumber(value).times(new bignumber_js_1.BigNumber(10).pow(countervalue.units[0].magnitude)), {
                        showCode: true,
                        disableRounding: true
                    }).padStart(20);
                }
            });
    }
};
exports["default"] = {
    description: "Get the balance history for accounts",
    args: [
        {
            name: "currency",
            alias: "c",
            type: String,
            multiple: true,
            desc: "ticker of a currency"
        },
        {
            name: "countervalue",
            alias: "C",
            type: String,
            multiple: true,
            desc: "ticker of a currency"
        },
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
        {
            name: "verbose",
            alias: "v",
            type: Boolean
        },
        {
            name: "fiats",
            type: Boolean,
            desc: "enable all fiats as countervalues"
        },
        {
            name: "marketcap",
            alias: "m",
            type: Number,
            desc: "use top N first tickers available in marketcap instead of having to specify each --currency"
        },
        {
            name: "disableAutofillGaps",
            alias: "g",
            type: Boolean,
            desc: "if set, disable the autofill of gaps to evaluate the rates availability"
        },
        {
            name: "latest",
            alias: "l",
            type: Boolean,
            desc: "only fetch latest"
        },
        {
            name: "startDate",
            alias: "d",
            type: String,
            desk: "starting date for all time historical data. combine with -p all."
        },
    ],
    job: function (opts) {
        return rxjs_1.Observable.create(function (o) {
            function f() {
                return __awaiter(this, void 0, void 0, function () {
                    var currencies, countervalues, format, startDate, dates, cvs, histos, _a, available, total;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, getCurrencies(opts)];
                            case 1:
                                currencies = _b.sent();
                                countervalues = getCountervalues(opts);
                                format = histoFormatters[opts.format || "default"];
                                startDate = getStartDate(opts);
                                dates = getDatesWithOpts(opts);
                                return [4 /*yield*/, (0, logic_1.loadCountervalues)(logic_1.initialState, {
                                        trackingPairs: (0, logic_1.resolveTrackingPairs)((0, lodash_1.product)(currencies, countervalues).map(function (_a) {
                                            var _b = __read(_a, 2), currency = _b[0], countervalue = _b[1];
                                            return ({
                                                from: currency,
                                                to: countervalue,
                                                startDate: startDate
                                            });
                                        })),
                                        autofillGaps: !opts.disableAutofillGaps
                                    })];
                            case 2:
                                cvs = _b.sent();
                                // eslint-disable-next-line no-console
                                if (opts.verbose)
                                    console.log(cvs);
                                histos = [];
                                (0, lodash_1.product)(currencies, countervalues).forEach(function (_a) {
                                    var _b = __read(_a, 2), currency = _b[0], countervalue = _b[1];
                                    var value = Math.pow(10, currency.units[0].magnitude);
                                    var histo = (0, logic_1.calculateMany)(cvs, dates.map(function (date) { return ({
                                        value: value,
                                        date: date
                                    }); }), {
                                        from: currency,
                                        to: countervalue
                                    }).map(function (value, i) { return ({
                                        value: value,
                                        date: dates[i]
                                    }); });
                                    histos.push(histo);
                                    o.next(format(histo, currency, countervalue));
                                });
                                if (opts.format === "stats") {
                                    _a = __read(histos.reduce(function (_a, histo) {
                                        var _b = __read(_a, 2), available = _b[0], total = _b[1];
                                        return [
                                            available + histo.filter(function (h) { return h.value; }).length,
                                            total + histo.length,
                                        ];
                                    }, [0, 0]), 2), available = _a[0], total = _a[1];
                                    o.next("Total availability: " + ((100 * available) / total).toFixed() + "%");
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            }
            f();
        });
    }
};
function asPortfolioRange(period) {
    var ranges = (0, range_1.getRanges)();
    (0, invariant_1["default"])(ranges.includes(period), "invalid period. valid values are %s", ranges.join(" | "));
    return period;
}
function getCurrencies(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var tickers;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!opts.marketcap) return [3 /*break*/, 2];
                    return [4 /*yield*/, api_1["default"].fetchMarketcapTickers()];
                case 1:
                    tickers = _a.sent();
                    tickers.splice(opts.marketcap);
                    _a.label = 2;
                case 2:
                    if (opts.currency) {
                        tickers = (tickers || []).concat(opts.currency);
                    }
                    return [2 /*return*/, (0, uniq_1["default"])((tickers || ["BTC"]).map(currencies_1.findCurrencyByTicker).filter(Boolean))];
            }
        });
    });
}
function getCountervalues(opts) {
    return opts.fiats
        ? (0, currencies_1.listFiatCurrencies)().map(function (a) { return a; })
        : (opts.countervalue || ["USD"])
            .map(currencies_1.findCurrencyByTicker)
            .filter(Boolean);
}
function getStartDate(opts) {
    if (!opts.startDate || opts.latest)
        return null;
    var date = new Date(opts.startDate);
    // FIXME: valueOf on date for arithmetics operation in typescript
    (0, invariant_1["default"])(!isNaN(date.valueOf()), "invalid startDate");
    return date;
}
function getDatesWithOpts(opts) {
    var startDate = getStartDate(opts);
    if (!startDate || opts.latest)
        return [new Date()];
    var range = asPortfolioRange(opts.period || "month");
    var count = (0, v2_1.getPortfolioCountByDate)(startDate, range);
    return (0, range_1.getDates)(range, count);
}
//# sourceMappingURL=countervalues.js.map