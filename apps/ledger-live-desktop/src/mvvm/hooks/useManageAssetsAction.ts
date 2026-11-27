import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";

export function useManageAssetsAction(account: Account): (() => void) | undefined {
  const dispatch = useDispatch();
  const { manageAssetsAction } = useLLDCoinFamily<Account, never, never, never>(
    account.currency.family,
  );

  return useMemo(() => {
    if (!manageAssetsAction?.canManage(account)) return undefined;

    return () => manageAssetsAction.open({ account, dispatch });
  }, [account, dispatch, manageAssetsAction]);
}
