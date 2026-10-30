import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { listHeldAssets } from "@features/platform-quick-actions";
import { useSelector } from "LLD/hooks/redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { AccountAsset } from "./types";

export function useAccountHeroAssets(account: Account): readonly AccountAsset[] {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(
    () => listHeldAssets(account, new Set(blacklistedTokenIds)),
    [account, blacklistedTokenIds],
  );
}
