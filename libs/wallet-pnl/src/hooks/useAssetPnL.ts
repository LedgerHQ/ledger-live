import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { computeAssetPnL } from "../assetPnL";
import type { AssetPnL, ComputePnLOptions } from "../types";

export function useAssetPnL(
  account: AccountLike,
  countervalues: unknown,
  fiat: Currency,
  options?: ComputePnLOptions,
): AssetPnL | null {
  return useMemo(
    () => computeAssetPnL(account, countervalues, fiat, options),
    [account, countervalues, fiat, options],
  );
}
