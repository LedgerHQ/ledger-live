import { useCallback, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { track } from "@shared/analytics";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";

type EditNameDialogState = {
  readonly accountId: string;
  readonly session: number;
  readonly open: boolean;
};

export type EditNameDialog = {
  readonly account: AccountLike;
  readonly asset: string;
  readonly session: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

export function useEditNameDialog(rows: AccountLike[]) {
  const [state, setState] = useState<EditNameDialogState | null>(null);

  const openEditName = useCallback((account: AccountLike) => {
    track("button_clicked", { button: "edit_account_name", page: CRYPTO_TRACKING_PAGE_NAME });
    setState(prev => ({ accountId: account.id, session: (prev?.session ?? 0) + 1, open: true }));
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setState(prev => (prev ? { ...prev, open } : prev));
  }, []);

  const account = state ? rows.find(row => row.id === state.accountId) : undefined;

  const editNameDialog: EditNameDialog | null =
    state && account
      ? {
          account,
          asset: getAccountCurrency(account).name,
          session: state.session,
          open: state.open,
          onOpenChange,
        }
      : null;

  return { openEditName, editNameDialog };
}
