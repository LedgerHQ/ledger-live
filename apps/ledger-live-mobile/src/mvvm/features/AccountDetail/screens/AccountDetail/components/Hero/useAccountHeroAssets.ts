import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
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
