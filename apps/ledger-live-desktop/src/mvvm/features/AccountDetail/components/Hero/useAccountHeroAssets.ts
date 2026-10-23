import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { listHeldAssets } from "@features/platform-quick-actions";
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
  return useMemo(() => {
    const values = assets.map(({ currency, account }) =>
      account.balance.isZero()
        ? new BigNumber(0)
        : calculateCountervalue(currency, account.balance),
    );
    if (values.every(value => value == null)) return undefined;
    return values.reduce((sum, value) => sum + (value?.toNumber() ?? 0), 0);
  }, [assets, calculateCountervalue]);
}
