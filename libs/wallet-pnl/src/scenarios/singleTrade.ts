import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { BTC, EUR, SAT } from "./currencies";
import { makeAccount } from "./accounts";
import { buy, sell } from "./operations";
import { buildCV, dailyHistory } from "./countervalues";

const QTY_BTC = new BigNumber("0.3");
const QTY_SAT = SAT.times(QTY_BTC);

const BUY_PRICE_EUR = 50000;
const SELL_PRICE_EUR = 68823.28;

const BUY_DATE = new Date(Date.UTC(2025, 0, 15));
const SELL_DATE = new Date(Date.UTC(2025, 5, 15));

const ENTRY_FEE_EUR = new BigNumber(50);
const EXIT_FEE_EUR = new BigNumber(25);

export type SingleTradeScenario = {
  heldAccount: Account;

  closedAccount: Account;
  countervalues: CounterValuesState;

  fees: { entryEur: BigNumber; exitEur: BigNumber };
  expected: {
    qtyBtc: BigNumber;
    investedEur: BigNumber;
    sellProceedsEur: BigNumber;
    grossRealisedPnLEur: BigNumber;
    grossUnrealisedAtSellPriceEur: BigNumber;
    grossPctOnCostBasis: BigNumber;
    feeAdjustedPnLEur: BigNumber;
    feeAdjustedPctOnInvestmentPlusFee: BigNumber;
  };
};

/**
 * "SingleTrade" — the smallest non-trivial PnL scenario: one buy, optionally
 * followed by one full sell at a higher price, on a single asset (BTC) priced
 * in a single fiat (EUR).
 *
 *   Buy:  0.3 BTC at €50,000 on 2025-01-15  (notional €15,000, entry fee €50)
 *   Sell: 0.3 BTC at €68,823.28 on 2025-06-15 (notional €20,646.98, exit fee €25)
 *
 * The same buy is shared by two account variants:
 *   - `heldAccount`   → buy only, balance = 0.3 BTC. Exercises `unrealisedPnL`
 *                       and the percentage helper against a non-zero `costBasis`.
 *   - `closedAccount` → buy + full sell, balance = 0. Exercises `realisedPnL`
 *                       on a fully disposed position, where `costBasis` returns
 *                       to 0 and `pnlPercentage` rightly returns `null`.
 *
 * Validates three things at once:
 *  1. Realised PnL on a clean round trip equals `qty × (sellPrice − buyPrice)`
 *     to the cent — no rounding artefacts from the running-ACB reducer.
 *  2. Our gross output (€5,646.98 / 37.65 %) sits exactly €75 above the
 *     fee-adjusted view (€5,571.98 / 37.02 %), and the wedge is entirely
 *     explained by `entryFee + exitFee`. No silent disagreement.
 *  3. After a full sell, `costBasis` is 0 → `pnlPercentage(totalPnL, costBasis)`
 *     returns `null` (documented behaviour, not a bug).
 */
export function buildSingleTradeScenario(): SingleTradeScenario {
  const buyOp = buy(QTY_SAT, BUY_DATE);
  const sellOp = sell(QTY_SAT, SELL_DATE);

  const heldAccount = makeAccount(BTC, {
    operations: [buyOp],
    balance: QTY_SAT,
  });

  const closedAccount = makeAccount(BTC, {
    operations: [buyOp, sellOp],
    balance: new BigNumber(0),
  });

  const countervalues = buildCV({
    pair: { from: BTC, to: EUR },
    history: dailyHistory([
      [BUY_DATE, BUY_PRICE_EUR],
      [SELL_DATE, SELL_PRICE_EUR],
    ]),
    latest: SELL_PRICE_EUR,
  });

  const investedEur = QTY_BTC.times(BUY_PRICE_EUR);
  const sellProceedsEur = QTY_BTC.times(SELL_PRICE_EUR);
  const grossRealisedPnLEur = sellProceedsEur.minus(investedEur);
  const grossPctOnCostBasis = grossRealisedPnLEur.div(investedEur).times(100);

  return {
    heldAccount,
    closedAccount,
    countervalues,
    fees: { entryEur: ENTRY_FEE_EUR, exitEur: EXIT_FEE_EUR },
    expected: {
      qtyBtc: QTY_BTC,
      investedEur,
      sellProceedsEur,
      grossRealisedPnLEur,
      grossUnrealisedAtSellPriceEur: grossRealisedPnLEur,
      grossPctOnCostBasis,
      feeAdjustedPnLEur: new BigNumber("5571.98"),
      feeAdjustedPctOnInvestmentPlusFee: new BigNumber("37.02"),
    },
  };
}
