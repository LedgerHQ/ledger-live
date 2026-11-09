import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";
import { useTokenTypes } from "~/renderer/families/useTokenTypes";

export type AddAssetViewModel = Readonly<{
  isVisible: boolean;
  onAddAsset: () => void;
}>;

export const useAddAssetViewModel = (account: Account): AddAssetViewModel => {
  const dispatch = useDispatch();
  const { addAssetAction } = useLLDCoinFamily<Account, never, never, never>(
    account.currency.family,
  );
  const tokenTypes = useTokenTypes(account.currency);

  const onAddAsset = useCallback(() => {
    addAssetAction?.({ account, dispatch });
  }, [account, addAssetAction, dispatch]);

  const isVisible = addAssetAction !== undefined && tokenTypes.length > 0;

  return { isVisible, onAddAsset };
};
