import { BigNumber } from "bignumber.js";
import asciichart from "asciichart";
import invariant from "invariant";
import { from } from "rxjs";
import { reduce, concatMap, map } from "rxjs/operators";
import type {
  Account,
  PortfolioRange,
} from "@ledgerhq/types-live";
import type {
  Currency
} from "@ledgerhq/types-cryptoassets";
import {
  flattenAccounts,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { getPortfolio, getRanges } from "@ledgerhq/live-common/portfolio/v2/index";
import {
  formatCurrencyUnit,
  findCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "@ledgerhq/live-common/countervalues/logic";

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
      desc: "if set, disable the autofill of gaps to evaluate the rates availability",
    },
  ],
  job: (
    opts: Partial<
      ScanCommonOpts & {
        disableAutofillGaps: boolean;
        countervalue: string;
        period: string;
      }
    >
  ) => {
    const countervalue = findCurrencyByTicker(opts.countervalue || "USD");
    invariant(
      countervalue,
      "currency not found with ticker=" + opts.countervalue
    );
    return scan(opts).pipe(
      reduce((all, a) => all.concat(a), [] as Account[]),
      concatMap((accounts) =>
        from(
          loadCountervalues(initialState, {
            trackingPairs: inferTrackingPairForAccounts(
              accounts,
              countervalue as Currency
            ),
            autofillGaps: !opts.disableAutofillGaps,
          })
        ).pipe(
          map((state) => {
            const all = flattenAccounts(accounts);
            const period = asPortfolioRange(opts.period || "month");
            const unit = (countervalue as Currency).units[0];

            function render(title, accounts) {
              const portfolio = getPortfolio(
                accounts,
                period,
                state,
                countervalue as Currency
              );
              const balance =
                portfolio.balanceHistory[portfolio.balanceHistory.length - 1]
                  .value;
              return (
                title +
                " " +
                formatCurrencyUnit(unit, new BigNumber(balance), {
                  showCode: true,
                  disableRounding: true,
                }) +
                (portfolio.countervalueChange.percentage
                  ? " ::: " +
                    "on a " +
                    period +
                    " period: " +
                    Math.round(
                      portfolio.countervalueChange.percentage * 100
                    ).toString() +
                    "% (" +
                    formatCurrencyUnit(
                      unit,
                      new BigNumber(portfolio.countervalueChange.value),
                      {
                        showCode: true,
                      }
                    ) +
                    ")"
                  : "") +
                "\n" +
                asciichart.plot(
                  portfolio.balanceHistory.map((h) =>
                    new BigNumber(h.value)
                      .div(new BigNumber(10).pow(unit.magnitude))
                      .toNumber()
                  ),
                  {
                    height: 10,
                    format: (value) =>
                      formatCurrencyUnit(
                        unit,
                        new BigNumber(value).times(
                          new BigNumber(10).pow(unit.magnitude)
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
