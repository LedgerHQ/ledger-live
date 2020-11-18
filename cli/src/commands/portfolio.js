// @flow

import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { from } from "rxjs";
import { reduce, concatMap, map } from "rxjs/operators";
import type { PortfolioRange } from "@ledgerhq/live-common/lib/types";
import {
  flattenAccounts,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { getPortfolio, getRanges } from "@ledgerhq/live-common/lib/portfolio";
import {
  formatCurrencyUnit,
  findCurrencyByTicker,
} from "@ledgerhq/live-common/lib/currencies";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import {
  initialState,
  calculate,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "@ledgerhq/live-common/lib/countervalues/logic";

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
      name: "countervalue",
      type: String,
      desc: "ticker of a currency",
    },
    {
      name: "period",
      alias: "p",
      type: String,
      desc: getRanges().join(" | "),
    },
    {
      name: "disableAutofillGaps",
      alias: "g",
      type: Boolean,
      desc:
        "if set, disable the autofill of gaps to evaluate the rates availability",
    },
  ],
  job: (
    opts: $Shape<
      ScanCommonOpts & {
        disableAutofillGaps: boolean,
        countervalue: string,
        period: string,
      }
    >
  ) => {
    const countervalue = findCurrencyByTicker(opts.countervalue || "USD");
    invariant(
      countervalue,
      "currency not found with ticker=" + opts.countervalue
    );

    return scan(opts).pipe(
      reduce((all, a) => all.concat(a), []),
      concatMap((accounts) =>
        from(
          loadCountervalues(initialState, {
            trackingPairs: inferTrackingPairForAccounts(accounts, countervalue),
            autofillGaps: !opts.disableAutofillGaps,
          })
        ).pipe(
          map((countervalues) => {
            const all = flattenAccounts(accounts);
            const period = asPortfolioRange(opts.period || "month");
            const unit = countervalue.units[0];
            const calc = (c, v, date) =>
              BigNumber(
                calculate(countervalues, {
                  date,
                  value: v.toNumber(),
                  from: c,
                  to: countervalue,
                }) || 0
              );

            function render(title, accounts) {
              const portfolio = getPortfolio(accounts, period, calc);
              const balance =
                portfolio.balanceHistory[portfolio.balanceHistory.length - 1]
                  .value;

              return (
                title +
                " " +
                formatCurrencyUnit(unit, balance, {
                  showCode: true,
                  disableRounding: true,
                }) +
                (portfolio.countervalueChange.percentage
                  ? " ::: " +
                    "on a " +
                    period +
                    " period: " +
                    portfolio.countervalueChange.percentage
                      .times(100)
                      .integerValue()
                      .toString() +
                    "% (" +
                    formatCurrencyUnit(
                      unit,
                      portfolio.countervalueChange.value,
                      {
                        showCode: true,
                      }
                    ) +
                    ")"
                  : "") +
                "\n" +
                asciichart.plot(
                  portfolio.balanceHistory.map((h) =>
                    h.value.div(BigNumber(10).pow(unit.magnitude)).toNumber()
                  ),
                  {
                    height: 10,
                    format: (value) =>
                      formatCurrencyUnit(
                        unit,
                        BigNumber(value).times(
                          BigNumber(10).pow(unit.magnitude)
                        ),
                        {
                          showCode: true,
                          disableRounding: true,
                        }
                      ).padStart(20),
                  }
                )
              );
            }

            let str = "";

            accounts.forEach((top) => {
              str += render("Account " + getAccountName(top), [top]);
              str += "\n";
              if (top.subAccounts) {
                top.subAccounts.forEach((sub) => {
                  str += render(
                    "Account " +
                      getAccountName(top) +
                      " > " +
                      getAccountName(sub),
                    [sub]
                  ).replace(/\n/s, "  \n");
                  str += "\n";
                });
              }
              str += "\n";
            });
            str += "\n";

            str += render(
              "SUMMARY OF PORTFOLIO: " + all.length + " accounts, total of ",
              accounts
            );

            return str;
          })
        )
      )
    );
  },
};
