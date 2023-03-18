import "lodash.product";
// @ts-expect-error product is not inferred we need to extend lodash type
import { product } from "lodash";
import uniq from "lodash/uniq";
import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { Observable } from "rxjs";
import { toBalanceHistoryRaw } from "@ledgerhq/live-common/account/index";
import type { PortfolioRange } from "@ledgerhq/types-live";
import {
  getRanges,
  getDates,
  getPortfolioCountByDate,
 } from "@ledgerhq/live-common/portfolio/v2/index";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import {
  formatCurrencyUnit,
  findCurrencyByTicker,
  listFiatCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import {
  initialState,
  calculateMany,
  loadCountervalues,
  resolveTrackingPairs,
} from "@ledgerhq/live-common/countervalues/logic";
import CountervaluesAPI from "@ledgerhq/live-common/countervalues/api/index";
const histoFormatters = {
  stats: (histo, currency, countervalue) =>
    (currency.ticker + " to " + countervalue.ticker).padEnd(12) +
    " availability=" +
    ((100 * histo.filter((h) => h.value).length) / histo.length).toFixed(0) +
    "%",
  supportedFiats: (histo, _currency, countervalue) => {
    const availability = (
      (100 * histo.filter((h) => h.value).length) /
      histo.length
    ).toFixed(0);
    return availability === "100" ? `"${countervalue.ticker}",` : undefined;
  },
  default: (histo, currency, countervalue) =>
    histo
      .map(
        ({ date, value }) =>
          (currency.ticker + "➡" + countervalue.ticker).padEnd(10) +
          " " +
          date.toISOString() +
          " " +
          formatCurrencyUnit(countervalue.units[0], new BigNumber(value || 0), {
            showCode: true,
            disableRounding: true,
          })
      )
      .join("\n"),
  json: (histo) => toBalanceHistoryRaw(histo),
  asciichart: (history, currency, countervalue) =>
    "\n" +
    "".padStart(22) +
    currency.name +
    " to " +
    countervalue.name +
    "\n" +
    asciichart.plot(
      history.map((h) =>
        new BigNumber(h.value || 0)
          .div(new BigNumber(10).pow(countervalue.units[0].magnitude))
          .toNumber()
      ),
      {
        height: 10,
        format: (value) =>
          formatCurrencyUnit(
            countervalue.units[0],
            new BigNumber(value).times(
              new BigNumber(10).pow(countervalue.units[0].magnitude)
            ),
            {
              showCode: true,
              disableRounding: true,
            }
          ).padStart(20),
      }
    ),
};
type Opts = Partial<{
  currency: string[];
  countervalue: string[];
  fiats: boolean;
  format: string;
  period: string;
  verbose: boolean;
  marketcap: number;
  disableAutofillGaps: boolean;
  latest: boolean;
  startDate: string;
}>;
export default {
  description: "Get the balance history for accounts",
  args: [
    {
      name: "currency",
      alias: "c",
      type: String,
      multiple: true,
      desc: "ticker of a currency",
    },
    {
      name: "countervalue",
      alias: "C",
      type: String,
      multiple: true,
      desc: "ticker of a currency",
    },
    {
      name: "period",
      alias: "p",
      type: String,
      desc: getRanges().join(" | "),
    },
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(histoFormatters).join(" | "),
      desc: "how to display the data",
    },
    {
      name: "verbose",
      alias: "v",
      type: Boolean,
    },
    {
      name: "fiats",
      type: Boolean,
      desc: "enable all fiats as countervalues",
    },
    {
      name: "marketcap",
      alias: "m",
      type: Number,
      desc: "use top N first tickers available in marketcap instead of having to specify each --currency",
    },
    {
      name: "disableAutofillGaps",
      alias: "g",
      type: Boolean,
      desc: "if set, disable the autofill of gaps to evaluate the rates availability",
    },
    {
      name: "latest",
      alias: "l",
      type: Boolean,
      desc: "only fetch latest",
    },
    {
      name: "startDate",
      alias: "d",
      type: String,
      desk: "starting date for all time historical data. combine with -p all.",
    },
  ],
  job: (opts: Opts) =>
    Observable.create((o) => {
      async function f() {
        const currencies = await getCurrencies(opts);
        const countervalues = getCountervalues(opts);
        const format = histoFormatters[opts.format || "default"];
        const startDate = getStartDate(opts);
        const dates = getDatesWithOpts(opts);
        const cvs = await loadCountervalues(initialState, {
          trackingPairs: resolveTrackingPairs(
            product(currencies, countervalues).map(
              ([currency, countervalue]) => ({
                from: currency,
                to: countervalue,
                startDate,
              })
            )
          ),
          autofillGaps: !opts.disableAutofillGaps,
        });
        // eslint-disable-next-line no-console
        if (opts.verbose) console.log(cvs);
        const histos: {
          value: number | null | undefined;
          date: Date;
        }[][] = [];
        product(currencies, countervalues).forEach(
          ([currency, countervalue]) => {
            const value = 10 ** currency.units[0].magnitude;
            const histo = calculateMany(
              cvs,
              dates.map((date) => ({
                value,
                date,
              })),
              {
                from: currency,
                to: countervalue,
              }
            ).map((value, i) => ({
              value,
              date: dates[i],
            }));
            histos.push(histo);
            o.next(format(histo, currency, countervalue));
          }
        );

        if (opts.format === "stats") {
          const [available, total] = histos.reduce(
            ([available, total], histo) => [
              available + histo.filter((h) => h.value).length,
              total + histo.length,
            ],
            [0, 0]
          );
          o.next(
            "Total availability: " + ((100 * available) / total).toFixed() + "%"
          );
        }
      }

      f();
    }),
};

function asPortfolioRange(period: string): PortfolioRange {
  const ranges = getRanges();
  invariant(
    ranges.includes(period),
    "invalid period. valid values are %s",
    ranges.join(" | ")
  );
  return period as PortfolioRange;
}

async function getCurrencies(opts: Opts): Promise<Currency[]> {
  let tickers;

  if (opts.marketcap) {
    tickers = await CountervaluesAPI.fetchMarketcapTickers();
    tickers.splice(opts.marketcap);
  }

  if (opts.currency) {
    tickers = (tickers || []).concat(opts.currency);
  }

  return uniq((tickers || ["BTC"]).map(findCurrencyByTicker).filter(Boolean));
}

function getCountervalues(opts: Opts): Currency[] {
  return opts.fiats
    ? listFiatCurrencies().map((a) => a)
    : ((opts.countervalue || ["USD"])
        .map(findCurrencyByTicker)
        .filter(Boolean) as Currency[]);
}

function getStartDate(opts: Opts): Date | null {
  if (!opts.startDate || opts.latest) return null;
  const date = new Date(opts.startDate);
  // FIXME: valueOf on date for arithmetics operation in typescript
  invariant(!isNaN(date.valueOf()), "invalid startDate");
  return date;
}

function getDatesWithOpts(opts: Opts): Date[] {
  const startDate = getStartDate(opts);
  if (!startDate || opts.latest) return [new Date()];
  const range = asPortfolioRange(opts.period || "month");
  const count = getPortfolioCountByDate(startDate, range);
  return getDates(range, count);
}
