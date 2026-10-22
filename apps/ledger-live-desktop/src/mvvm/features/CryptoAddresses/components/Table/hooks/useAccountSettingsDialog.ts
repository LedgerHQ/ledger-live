import { useCallback, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";

type AccountSettingsDialogState = {
  readonly accountId: string;
  readonly open: boolean;
};

export type AccountSettingsDialogData = {
  readonly account: Account;
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function useAccountSettingsDialog(rows: AccountLike[]) {
  const [state, setState] = useState<AccountSettingsDialogState | null>(null);

  const openSettings = useCallback((account: AccountLike) => {
    track("button_clicked", { button: "account_settings", page: CRYPTO_TRACKING_PAGE_NAME });
    setState({ accountId: account.id, open: true });
  }, []);

  const onClose = useCallback(() => {
    setState(prev => (prev ? { ...prev, open: false } : prev));
  }, []);

  const account = state ? rows.find(row => row.id === state.accountId) : undefined;

  const settingsDialog: AccountSettingsDialogData | null =
    state && account?.type === "Account" ? { account, isOpen: state.open, onClose } : null;

  return { openSettings, settingsDialog };
}
