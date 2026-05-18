import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account";
import { computeAssetPnL } from "./assetPnL";
import type { ComputePnLOptions, PortfolioPnL } from "./types";

const ZERO = new BigNumber(0);

export function computePortfolioPnL(
  accounts: AccountLike[],
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): PortfolioPnL {
  let unrealisedPnL = ZERO;
  let realisedPnL = ZERO;
  let totalPnL = ZERO;
  let costBasis = ZERO;
  let lifetimeCost = ZERO;

  for (const account of flattenAccounts(accounts)) {
    const assetPnL = computeAssetPnL(account, countervalues, fiat, options);
    if (!assetPnL) continue;
    unrealisedPnL = unrealisedPnL.plus(assetPnL.unrealisedPnL);
    realisedPnL = realisedPnL.plus(assetPnL.realisedPnL);
    totalPnL = totalPnL.plus(assetPnL.totalPnL);
    costBasis = costBasis.plus(assetPnL.costBasis);
    lifetimeCost = lifetimeCost.plus(assetPnL.lifetimeCost);
  }

  return { unrealisedPnL, realisedPnL, totalPnL, costBasis, lifetimeCost };
}
