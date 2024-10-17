import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { map } from "rxjs/operators";
import { toBalanceHistoryRaw } from "@ledgerhq/live-common/account/index";
import {
  getBalanceHistory,
  getPortfolioCount,
  getRanges,
} from "@ledgerhq/live-countervalues/portfolio";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import type { Account, BalanceHistory, PortfolioRange } from "@ledgerhq/types-live";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";

const histoFormatters: Record<string, (histo: BalanceHistory, account: Account) => unknown> = {
  default: (histo, account) =>
    histo
      .map(
        ({ date, value }) =>
          date.toISOString() +
          " " +
          formatCurrencyUnit(account.currency.units[0], new BigNumber(value), {
            showCode: true,
            disableRounding: true,
          }),
      )
      .join("\n"),
  json: histo => toBalanceHistoryRaw(histo),
  asciichart: (history, account) =>
    "\n" +
    "".padStart(22) +
    getDefaultAccountNameForCurrencyIndex(account) +
    ": " +
    formatCurrencyUnit(account.currency.units[0], account.balance, {
      showCode: true,
      disableRounding: true,
    }) +
    "\n" +
    asciichart.plot(
      history.map(
        h => h.value / new BigNumber(10).pow(account.currency.units[0].magnitude).toNumber(),
      ),
      {
        height: 10,
        format: value =>
          formatCurrencyUnit(
            account.currency.units[0],
            new BigNumber(value).times(new BigNumber(10).pow(account.currency.units[0].magnitude)),
            {
              showCode: true,
              disableRounding: true,
            },
          ).padStart(20),
      },
    ),
};

function asPortfolioRange(period: string): PortfolioRange {
  const ranges = getRanges();
  invariant(ranges.includes(period), "invalid period. valid values are %s", ranges.join(" | "));
  return period as PortfolioRange;
}

export type BalanceHistoryJobOpts = ScanCommonOpts & {
  period: string;
  format: string;
};

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
  job: (opts: BalanceHistoryJobOpts) =>
    scan(opts).pipe(
      map(account => {
        const range = asPortfolioRange(opts.period || "month");
        const count = getPortfolioCount([account], range);
        const histo = getBalanceHistory(account, range, count);
        const format = histoFormatters[opts.format || "default"];
        return format(histo, account);
      }),
    ),
};
