import { Account } from "@ledgerhq/types-live";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

type UseImportedAccountsProps = {
  onComplete: (accounts: Account[]) => void;
  selectedIds: string[];
  scannedAccounts: Account[];
};

export function useImportAccounts({
  onComplete,
  selectedIds,
  scannedAccounts,
}: UseImportedAccountsProps) {
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const [hasImportedAccounts, setHasImportedAccounts] = useState(false);

  const handleConfirm = useCallback(() => {
    const accountsToImport = scannedAccounts.filter(a => selectedIds.includes(a.id));
    if (accountsToImport.length > 0) {
      setHasImportedAccounts(true);
    }
    dispatch(
      addAccountsAction({
        existingAccounts,
        scannedAccounts,
        selectedIds,
        renamings: {},
      }),
    );
    onComplete(scannedAccounts.filter(a => selectedIds.includes(a.id)));
  }, [dispatch, existingAccounts, scannedAccounts, selectedIds, onComplete]);

  return {
    hasImportedAccounts,
    handleConfirm,
  };
}
