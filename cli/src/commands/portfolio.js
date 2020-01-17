// @flow

import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { reduce, map } from "rxjs/operators";
import type { PortfolioRange } from "@ledgerhq/live-common/lib/types";
import { getPortfolio, getRanges } from "@ledgerhq/live-common/lib/portfolio";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

function asPortfolioRange(period: string): PortfolioRange {
  const ranges = getRanges();
  invariant(
    ranges.includes(period),
    "invalid period. valid values are %s",
    ranges.join(" | ")
  );
  // $FlowFixMe
  return period;
}

export default {
  description: "Get a portfolio summary for accounts",
  args: [
    ...scanCommonOpts,
    {
      name: "period",
      alias: "p",
      type: String,
      desc: getRanges().join(" | ")
    }
  ],
  job: (
    opts: ScanCommonOpts & {
      period: string
    }
  ) =>
    scan(opts).pipe(
      reduce((all, a) => all.concat(a), []),
      map(accounts => {
        const currency = accounts[0].currency;
        const period = asPortfolioRange(opts.period || "month");
        const portfolio = getPortfolio(accounts, period, (c, v) => {
          // for now we don't support countervalues but keep only the main currency
          if (c !== currency) return BigNumber(0);
          return v;
        });
        const balance =
          portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value;
        const unit = currency.units[0];

        return (
          accounts.length +
          " accounts, total of " +
          formatCurrencyUnit(unit, balance, {
            showCode: true,
            disableRounding: true
          }) +
          "\n" +
          "on a " +
          period +
          " period: " +
          (portfolio.countervalueChange.percentage
            ? portfolio.countervalueChange.percentage
                .times(100)
                .integerValue()
                .toString() +
              "% (" +
              formatCurrencyUnit(unit, portfolio.countervalueChange.value, {
                showCode: true
              }) +
              ")"
            : "") +
          "\n" +
          asciichart.plot(
            portfolio.balanceHistory.map(h =>
              h.value.div(BigNumber(10).pow(unit.magnitude)).toNumber()
            ),
            {
              height: 10,
              format: value =>
                formatCurrencyUnit(
                  unit,
                  BigNumber(value).times(BigNumber(10).pow(unit.magnitude)),
                  {
                    showCode: true,
                    disableRounding: true
                  }
                ).padStart(20)
            }
          )
        );
      })
    )
};
