import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { ETH, USD, WEI } from "./currencies";
import { makeAccount } from "./accounts";
import { buy, reward } from "./operations";
import { buildCV, dailyHistory } from "./countervalues";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

const INITIAL_BUY_DATE = new Date(Date.UTC(2025, 0, 10));
const INITIAL_BUY_AMOUNT = WEI.times(10);
const INITIAL_BUY_PRICE = 1500;

const REWARD_AMOUNT = WEI.times("0.05");
const REWARD_PRICES = [1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700];
const REWARD_DATES = REWARD_PRICES.map((_, i) => new Date(Date.UTC(2025, 1 + i, 1)));

export type StakerScenario = {
  account: Account;
  countervalues: CounterValuesState;
  expected: {
    finalAmountEth: BigNumber;
    totalCostUsd: BigNumber;
    averageEntryPriceUsdPerEth: BigNumber;
  };
};

/**
 * "Staker" — one initial buy, then 12 monthly REWARD inflows. No sells.
 *
 * Operations (chronological):
 *  - 1 buy of 10 ETH on 2025-01-10 at $1500.
 *  - 12 REWARD inflows of 0.05 ETH on the 1st of each month from 2025-02-01
 *    to 2026-01-01, at rising prices $1600 → $2700.
 *
 * Counter-values: one historical rate per op date + `latest = $2800`.
 *
 * Stresses that REWARD ops count as inflows (per `classifyOperation` spec)
 * and add to cost basis at the reward date's market price. Since there are
 * no sells, the running ACB and the naive `Σ cost / Σ amount` formula
 * agree → `expected.totalCostUsd` and `expected.averageEntryPriceUsdPerEth`
 * can be hand-computed without splitting by sell date.
 *
 * `realisedPnL` should always be 0; `unrealisedPnL` positive since the
 * latest price ($2800) is above the weighted average entry.
 */
export function buildStakerScenario(): StakerScenario {
  const operations = [
    buy(INITIAL_BUY_AMOUNT, INITIAL_BUY_DATE),
    ...REWARD_PRICES.map((_, i) => reward(REWARD_AMOUNT, REWARD_DATES[i])),
  ];

  const totalRewardEth = new BigNumber("0.05").times(REWARD_PRICES.length);
  const finalAmountEth = new BigNumber(10).plus(totalRewardEth);
  const finalAmountWei = WEI.times(finalAmountEth);

  const account = makeAccount(ETH, {
    operations,
    balance: finalAmountWei,
  });

  const history = dailyHistory([
    [INITIAL_BUY_DATE, INITIAL_BUY_PRICE],
    ...REWARD_DATES.map((d, i): [Date, number] => [d, REWARD_PRICES[i]]),
  ]);

  const countervalues = buildCV({
    pair: { from: ETH, to: USD },
    history,
    latest: 2800,
  });

  const rewardsCostUsd = REWARD_PRICES.reduce(
    (acc, p) => acc.plus(new BigNumber(p).times("0.05")),
    new BigNumber(0),
  );
  const totalCostUsd = new BigNumber(15000).plus(rewardsCostUsd);
  const averageEntryPriceUsdPerEth = totalCostUsd.div(finalAmountEth);

  return {
    account,
    countervalues,
    expected: {
      finalAmountEth,
      totalCostUsd,
      averageEntryPriceUsdPerEth,
    },
  };
}
