import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";

export type AddAssetViewModel = Readonly<{
  isVisible: boolean;
  onAddAsset: () => void;
}>;

export const useAddAssetViewModel = (account: Account): AddAssetViewModel => {
  const dispatch = useDispatch();
  const { addAssetAction } = useLLDCoinFamily<Account, never, never, never>(
    account.currency.family,
  );

  const onAddAsset = useCallback(() => {
    addAssetAction?.({ account, dispatch });
  }, [account, addAssetAction, dispatch]);

  return { isVisible: addAssetAction !== undefined, onAddAsset };
};
