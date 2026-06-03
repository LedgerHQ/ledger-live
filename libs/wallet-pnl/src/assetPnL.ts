import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { getCostBasis } from "./costBasisCache";
import { applyBalanceReconciliation, detectBalanceGap } from "./costBasisReconciliation";
import type { AssetPnL, ComputePnLOptions, Reconciliation } from "./types";

const ZERO = new BigNumber(0);

export function computeAssetPnL(
  account: AccountLike,
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetPnL | null {
  const asset = getAccountCurrency(account);
  const rawState = getCostBasis(account, fiat, countervalues, options);

  const hasOps = account.operations.length > 0;
  const hasBalance = account.balance.gt(0);

  if (!hasOps && !hasBalance) return null;

  // Reconciliation defaults to ON: if the chain says the wallet holds X and
  // the cost-basis reducer thinks Y, we close the gap so consumers don't see
  // a wildly negative `unrealisedPnL` on tokens whose disposals weren't
  // captured (typical ERC-20 `transferFrom`-after-`APPROVE` flows). Callers
  // that need raw, op-only values can pass `reconcileWithBalance: false`.
  //
  // Detection (`detectBalanceGap`) is pure and always cheap; only the actual
  // repair (`applyBalanceReconciliation`) is gated on the opt-in flag. This
  // keeps the diagnostic available for downstream UIs even when the repair
  // is suppressed.
  const apply = options?.reconcileWithBalance !== false;
  const gap = detectBalanceGap(rawState, account.balance);
  let state = rawState;
  let applied = false;
  if (apply && !gap.isClean) {
    const result = applyBalanceReconciliation(rawState, gap, asset, fiat, countervalues);
    state = result.state;
    applied = result.applied;
  }
  const reconciliation: Reconciliation = { ...gap, applied };

  const hasHistory = !state.totalAmount.isZero() || !state.realisedPnL.isZero();

  let unrealisedPnL = ZERO;
  if (hasBalance) {
    const latestCV = calculate(countervalues, {
      value: account.balance.toNumber(),
      from: asset,
      to: fiat,
      disableRounding: true,
    });
    if (latestCV != null && Number.isFinite(latestCV)) {
      unrealisedPnL = new BigNumber(latestCV).minus(state.totalCostInCounterValue);
    } else if (!hasHistory) {
      return null;
    }
  }

  return {
    unrealisedPnL,
    realisedPnL: state.realisedPnL,
    totalPnL: state.realisedPnL.plus(unrealisedPnL),
    costBasis: state.totalCostInCounterValue,
    lifetimeCost: state.lifetimeCostInCounterValue,
    averageEntryPrice: state.averageEntryPrice,
    reconciliation,
  };
}
