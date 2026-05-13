import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { computeAssetPnL } from "../assetPnL";
import type { AssetPnL, ComputePnLOptions } from "../types";

export function useAssetPnL(
  account: AccountLike,
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetPnL | null {
  return useMemo(
    () => computeAssetPnL(account, countervalues, fiat, options),
    [account, countervalues, fiat, options],
  );
}
