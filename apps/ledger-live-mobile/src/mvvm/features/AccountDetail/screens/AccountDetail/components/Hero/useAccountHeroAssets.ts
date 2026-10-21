import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useCalculateCountervalueCallback } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { listHeldAssets } from "@features/platform-quick-actions";
import type { AccountAsset } from "LLM/utils/accountAssets";

export function useAccountHeroAssets(account: Account): readonly AccountAsset[] {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(
    () => listHeldAssets(account, new Set(blacklistedTokenIds)),
    [account, blacklistedTokenIds],
  );
}

export function useAccountCountervalue(assets: readonly AccountAsset[]): number | undefined {
  const calculateCountervalue = useCalculateCountervalueCallback();
  return useMemo(() => {
    const values = assets.map(({ currency, account }) =>
      calculateCountervalue(currency, account.balance),
    );
    if (values.every(value => value == null)) return undefined;
    return values.reduce((sum, value) => sum + (value?.toNumber() ?? 0), 0);
  }, [assets, calculateCountervalue]);
}
