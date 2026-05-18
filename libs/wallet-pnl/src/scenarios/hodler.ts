import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { BTC, SAT, USD } from "./currencies";
import { makeAccount } from "./accounts";
import { buy, sell } from "./operations";
import { buildCV, dailyHistory } from "./countervalues";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

// Monthly close prices for 2024 + 2025 (USD).
const MONTHLY_PRICES = [
  30000, 32000, 35000, 38000, 41000, 44000, 47000, 50000, 53000, 56000, 60000, 64000, 68000, 70000,
  72000, 74000, 76000, 78000, 80000, 78000, 75000, 72000, 70000, 68000,
];

const MONTHLY_DATES = MONTHLY_PRICES.map((_, i) => {
  const month = i % 12;
  const year = 2024 + Math.floor(i / 12);
  return new Date(Date.UTC(year, month, 15));
});

const BUY_AMOUNT_SAT = SAT.times("0.05");
const SELL_DATE = new Date(Date.UTC(2025, 5, 20));
const SELL_PRICE = 70000;
const SELL_AMOUNT_SAT = SAT.times("0.3");

export type HodlerScenario = {
  account: Account;
  countervalues: CounterValuesState;
  expected: {
    boughtTotalSat: BigNumber;
    soldSat: BigNumber;
    finalAmountSat: BigNumber;
    finalCostBasisUsd: BigNumber;
    averageEntryPriceUsdPerBtc: BigNumber;
    realisedPnLUsd: BigNumber;
  };
};

/**
 * "Hodler" — DCA into BTC across 24 months, with a single partial sell injected mid-stream.
 *
 * Operations (chronological):
 *  - 24 monthly buys of 0.05 BTC, on the 15th of each month from 2024-01-15
 *    to 2025-12-15. Prices ramp $30k → $80k then back down to $68k.
 *  - 1 sell of 0.3 BTC on 2025-06-20 at $70k (lands between buys #17 and #18).
 *
 * Counter-values: one historical rate per op date + `latest = $75k`.
 *
 * Stresses the **running-ACB path-dependence**: the average entry price at
 * the sell time (over the first 18 buys) differs from the final average
 * (recomputed at each subsequent buy). `realisedPnL` must use the former,
 * `costBasis` reflects the holding after the sell has reduced totalCost.
 *
 * `expected` exposes both atomic-unit totals (`*Sat`) and the running-ACB
 * outputs in USD (`finalCostBasisUsd`, `realisedPnLUsd`,
 * `averageEntryPriceUsdPerBtc`). All prices are stored in atomic units
 * (1 BTC = 1e8 sat) so the math matches the implementation exactly.
 */
export function buildHodlerScenario(): HodlerScenario {
  const operations = [
    ...MONTHLY_PRICES.map((_, i) => buy(BUY_AMOUNT_SAT, MONTHLY_DATES[i])),
    sell(SELL_AMOUNT_SAT, SELL_DATE),
  ];

  const finalAmountSat = BUY_AMOUNT_SAT.times(MONTHLY_PRICES.length).minus(SELL_AMOUNT_SAT);
  const account = makeAccount(BTC, {
    operations,
    balance: finalAmountSat,
  });

  const history = dailyHistory([
    ...MONTHLY_DATES.map((d, i): [Date, number] => [d, MONTHLY_PRICES[i]]),
    [SELL_DATE, SELL_PRICE],
  ]);

  const countervalues = buildCV({
    pair: { from: BTC, to: USD },
    history,
    latest: 75000,
  });

  // Running ACB: split buys by side of the sell, compute the avg AT SELL TIME.
  const preSellPrices = MONTHLY_PRICES.filter((_, i) => MONTHLY_DATES[i] < SELL_DATE);
  const postSellPrices = MONTHLY_PRICES.filter((_, i) => MONTHLY_DATES[i] >= SELL_DATE);

  const sumUsd = (prices: number[]) =>
    prices.reduce((acc, p) => acc.plus(new BigNumber(p).times("0.05")), new BigNumber(0));

  const costPreSellUsd = sumUsd(preSellPrices);
  const btcPreSell = new BigNumber("0.05").times(preSellPrices.length);
  const avgAtSell = costPreSellUsd.div(btcPreSell);
  const soldBtc = new BigNumber("0.3");
  const realisedPnLUsd = soldBtc.times(new BigNumber(SELL_PRICE).minus(avgAtSell));
  const costOfSaleUsd = soldBtc.times(avgAtSell);

  const finalCostBasisUsd = costPreSellUsd.minus(costOfSaleUsd).plus(sumUsd(postSellPrices));
  const finalAmountBtc = btcPreSell
    .minus(soldBtc)
    .plus(new BigNumber("0.05").times(postSellPrices.length));
  const averageEntryPriceUsdPerBtc = finalCostBasisUsd.div(finalAmountBtc);

  return {
    account,
    countervalues,
    expected: {
      boughtTotalSat: BUY_AMOUNT_SAT.times(MONTHLY_PRICES.length),
      soldSat: SELL_AMOUNT_SAT,
      finalAmountSat,
      finalCostBasisUsd,
      averageEntryPriceUsdPerBtc,
      realisedPnLUsd,
    },
  };
}
