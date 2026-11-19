import { useCallback, useEffect } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";
import { accountsSelector, flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { closeFamilyDialog, selectFamilyDialogParams } from "./familyDialogs";

export function useFamilyDialogsViewModel() {
  const dispatch = useDispatch();
  const dialog = useSelector(selectFamilyDialogParams);
  const account = useSelector(state =>
    dialog ? flattenAccountsSelector(state).find(item => item.id === dialog.accountId) : undefined,
  );
  const parentAccount = useSelector(state =>
    account?.type === "TokenAccount"
      ? accountsSelector(state).find(item => item.id === account.parentId)
      : undefined,
  );
  const mainAccount: Account | undefined = account?.type === "Account" ? account : parentAccount;
  const { AccountDialog } = useLLDCoinFamily<Account, never, never, never>(
    mainAccount?.currency.family,
  );

  const onClose = useCallback(() => {
    dispatch(closeFamilyDialog());
  }, [dispatch]);

  const shouldClose = !!dialog && (!account || !mainAccount || !AccountDialog);
  useEffect(() => {
    if (shouldClose) dispatch(closeFamilyDialog());
  }, [shouldClose, dispatch]);

  if (!dialog || !account || !mainAccount || !AccountDialog) return null;

  return { AccountDialog, account, parentAccount, onClose, params: dialog.params };
}
