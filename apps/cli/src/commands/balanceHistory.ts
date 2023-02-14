import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { map } from "rxjs/operators";
import { toBalanceHistoryRaw } from "@ledgerhq/live-common/account/index";
import {
  getBalanceHistory,
  getPortfolioCount,
  getRanges,
} from "@ledgerhq/live-common/portfolio/v2/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { PortfolioRange } from "@ledgerhq/types-live";
const histoFormatters = {
  default: (histo, account) =>
    histo
      .map(
        ({ date, value }) =>
          date.toISOString() +
          " " +
          formatCurrencyUnit(account.unit, new BigNumber(value), {
            showCode: true,
            disableRounding: true,
          })
      )
      .join("\n"),
  json: (histo) => toBalanceHistoryRaw(histo),
  asciichart: (history, account) =>
    "\n" +
    "".padStart(22) +
    account.name +
    ": " +
    formatCurrencyUnit(account.unit, account.balance, {
      showCode: true,
      disableRounding: true,
    }) +
    "\n" +
    asciichart.plot(
      history.map((h) =>
        h.value.div(new BigNumber(10).pow(account.unit.magnitude)).toNumber()
      ),
      {
        height: 10,
        format: (value) =>
          formatCurrencyUnit(
            account.unit,
            new BigNumber(value).times(
              new BigNumber(10).pow(account.unit.magnitude)
            ),
            {
              showCode: true,
              disableRounding: true,
            }
          ).padStart(20),
      }
    ),
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

export default {
  description: "Get the balance history for accounts",
  args: [
    ...scanCommonOpts,
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
  ],
  job: (
    opts: ScanCommonOpts & {
      format: string;
      period: string;
    }
  ) =>
    scan(opts).pipe(
      map((account) => {
        const range = asPortfolioRange(opts.period || "month");
        const count = getPortfolioCount([account], range);
        const histo = getBalanceHistory(account, range, count);
        const format = histoFormatters[opts.format || "default"];
        return format(histo, account);
      })
    ),
};
