import React from "react";
import { AccountSettingsDialog } from "../AccountSettingsDialog/AccountSettingsDialog";
import type { AccountSettingsAccount, AccountSettingsProps } from "./types";
import { useAccountSettingsViewModel } from "./useAccountSettingsViewModel";

export function AccountSettings<TAccount extends AccountSettingsAccount>({
  account,
  adapter,
  isOpen,
  onClose,
  onEvent,
  testID,
}: AccountSettingsProps<TAccount>) {
  const viewModel = useAccountSettingsViewModel(account, adapter, onClose);

  return (
    <AccountSettingsDialog
      {...viewModel}
      isOpen={isOpen}
      onClose={onClose}
      onEvent={onEvent}
      testID={testID}
    />
  );
}
