import { BigNumber } from "bignumber.js";
import { plot } from "asciichart";
import invariant from "invariant";
import { from } from "rxjs";
import { reduce, concatMap, map } from "rxjs/operators";
import type { Account, AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { getPortfolio, getRanges } from "@ledgerhq/live-countervalues/portfolio";
import { formatCurrencyUnit, findCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues/logic";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

function asPortfolioRange(period: string): PortfolioRange {
  const ranges = getRanges();
  invariant(ranges.includes(period), "invalid period. valid values are %s", ranges.join(" | "));
  return period as PortfolioRange;
}

export type PortfolioJobOpts = ScanCommonOpts &
  Partial<{
    countervalue: string;
    period: string;
    disableAutofillGaps: boolean;
  }>;

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
  job: (opts: PortfolioJobOpts) => {
    const countervalue = findCurrencyByTicker(opts.countervalue || "USD");
    invariant(countervalue, "currency not found with ticker=" + opts.countervalue);
    return scan(opts).pipe(
      reduce((all, a) => all.concat(a), [] as Account[]),
      concatMap(accounts =>
        from(
          loadCountervalues(initialState, {
            trackingPairs: inferTrackingPairForAccounts(accounts, countervalue as Currency),
            autofillGaps: !opts.disableAutofillGaps,
            refreshRate: 60000,
            marketCapBatchingAfterRank: 20,
          }),
        ).pipe(
          map(state => {
            const all = flattenAccounts(accounts);
            const period = asPortfolioRange(opts.period || "month");
            const unit = (countervalue as Currency).units[0];

            function render(title: string, accounts: AccountLike[]) {
              const portfolio = getPortfolio(accounts, period, state, countervalue as Currency);
              const balance = portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value;
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
                    Math.round(portfolio.countervalueChange.percentage * 100).toString() +
                    "% (" +
                    formatCurrencyUnit(unit, new BigNumber(portfolio.countervalueChange.value), {
                      showCode: true,
                    }) +
                    ")"
                  : "") +
                "\n" +
                plot(
                  portfolio.balanceHistory.map(h =>
                    new BigNumber(h.value).div(new BigNumber(10).pow(unit.magnitude)).toNumber(),
                  ),
                  {
                    height: 10,
                    format: (value: BigNumber.Value) =>
                      formatCurrencyUnit(
                        unit,
                        new BigNumber(value).times(new BigNumber(10).pow(unit.magnitude)),
                        {
                          showCode: true,
                          disableRounding: true,
                        },
                      ).padStart(20),
                  },
                )
              );
            }

            let str = "";
            accounts.forEach(top => {
              str += render("Account " + getDefaultAccountName(top), [top]);
              str += "\n";

              if (top.subAccounts) {
                top.subAccounts.forEach(sub => {
                  str += render(
                    "Account " + getDefaultAccountName(top) + " > " + getDefaultAccountName(sub),
                    [sub],
                  ).replace(/\n/s, "  \n");
                  str += "\n";
                });
              }

              str += "\n";
            });
            str += "\n";
            str += render("SUMMARY OF PORTFOLIO: " + all.length + " accounts, total of ", accounts);
            return str;
          }),
        ),
      ),
    );
  },
};
