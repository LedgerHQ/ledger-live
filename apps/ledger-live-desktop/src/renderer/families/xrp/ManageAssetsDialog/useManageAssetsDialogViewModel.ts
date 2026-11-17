import { useCallback, useEffect, useState } from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getManagedTokenAccounts } from "../utils";
import { closeManageAssets, selectIsManageAssetsOpen } from "./manageAssetsDialog";

type SelectedAsset = Readonly<{ action: "edit" | "delete"; tokenAccount: TokenAccount }>;

export function useManageAssetsDialogViewModel(account: Account) {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsManageAssetsOpen);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);

  const onClose = useCallback(() => {
    setSelectedAsset(null);
    dispatch(closeManageAssets());
  }, [dispatch]);

  useEffect(
    () => () => {
      dispatch(closeManageAssets());
    },
    [dispatch],
  );

  const onBackToList = useCallback(() => setSelectedAsset(null), []);

  const onEdit = useCallback((tokenAccount: TokenAccount) => {
    setSelectedAsset({ action: "edit", tokenAccount });
  }, []);

  const onDelete = useCallback((tokenAccount: TokenAccount) => {
    setSelectedAsset({ action: "delete", tokenAccount });
  }, []);

  return {
    isOpen,
    selectedAsset,
    onClose,
    onBackToList,
    onEdit,
    onDelete,
    tokenAccounts: getManagedTokenAccounts(account),
  };
}
