import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { computeAssetPnL } from "./assetPnL";
import type { AssetGroupPnL, ComputePnLOptions } from "./types";

const ZERO = new BigNumber(0);

/**
 * Aggregate PnL across accounts that all hold the **same asset**. `averageEntryPrice`
 * is in `fiat` per full unit (e.g. USD per BTC).
 *
 * Callers must pass a pre-grouped list (e.g. `distributionItem.accounts`). This
 * function does NOT call `flattenAccounts` — doing so would inject ERC-20
 * sub-accounts into a parent ETH group and corrupt the cost basis.
 */
export function computeAssetGroupPnL(
  accounts: AccountLike[],
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetGroupPnL | null {
  if (accounts.length === 0) return null;

  let unrealisedPnL = ZERO;
  let realisedPnL = ZERO;
  let totalPnL = ZERO;
  let costBasis = ZERO;
  let lifetimeCost = ZERO;
  let totalAmount = ZERO;
  let contributed = false;

  for (const account of accounts) {
    const pnl = computeAssetPnL(account, countervalues, fiat, options);
    if (!pnl) continue;
    contributed = true;
    unrealisedPnL = unrealisedPnL.plus(pnl.unrealisedPnL);
    realisedPnL = realisedPnL.plus(pnl.realisedPnL);
    totalPnL = totalPnL.plus(pnl.totalPnL);
    costBasis = costBasis.plus(pnl.costBasis);
    lifetimeCost = lifetimeCost.plus(pnl.lifetimeCost);
    totalAmount = totalAmount.plus(pnl.reconciliation.onChainBalance);
  }

  if (!contributed) return null;

  const magnitude = getAccountCurrency(accounts[0]).units[0].magnitude;
  const totalAmountInFullUnits = totalAmount.shiftedBy(-magnitude);
  const averageEntryPrice = totalAmountInFullUnits.isZero()
    ? ZERO
    : costBasis.div(totalAmountInFullUnits);

  return {
    unrealisedPnL,
    realisedPnL,
    totalPnL,
    costBasis,
    lifetimeCost,
    totalAmount,
    averageEntryPrice,
  };
}
