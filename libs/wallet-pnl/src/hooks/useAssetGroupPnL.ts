import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { computeAssetGroupPnL } from "../assetGroupPnL";
import type { AssetGroupPnL, ComputePnLOptions } from "../types";

export function useAssetGroupPnL(
  accounts: AccountLike[],
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetGroupPnL | null {
  return useMemo(
    () => computeAssetGroupPnL(accounts, countervalues, fiat, options),
    [accounts, countervalues, fiat, options],
  );
}
