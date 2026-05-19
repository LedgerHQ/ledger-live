import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { computeAssetPnL } from "../../assetPnL";
import type { AssetPnL, ComputePnLOptions } from "../../types";

export function expectAssetPnL(
  account: AccountLike,
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetPnL {
  const pnl = computeAssetPnL(account, countervalues, fiat, options);
  if (pnl === null) {
    throw new Error(
      `expectAssetPnL: computeAssetPnL returned null for account "${account.id}" — the fixture has neither operations nor a balance`,
    );
  }
  return pnl;
}
