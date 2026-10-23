import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { listHeldAssets, sumAssetValues } from "@features/platform-quick-actions";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { AccountAsset } from "./types";

export function useAccountHeroAssets(account: Account): readonly AccountAsset[] {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(
    () => listHeldAssets(account, new Set(blacklistedTokenIds)),
    [account, blacklistedTokenIds],
  );
}

export function useAccountCountervalue(assets: readonly AccountAsset[]): number | undefined {
  const calculateCountervalue = useCalculateCountervalueCallback();
  return useMemo(
    () =>
      sumAssetValues(
        assets,
        ({ account }) => !account.balance.isZero(),
        ({ currency, account }) => calculateCountervalue(currency, account.balance)?.toNumber(),
      ),
    [assets, calculateCountervalue],
  );
}
