import React from "react";
import { AccountSettingsDialogView } from "./AccountSettingsDialogView.web";
import type { AccountSettingsDialogProps } from "./types.web";
import { useAccountSettingsDialogViewModel } from "./useAccountSettingsDialogViewModel.web";

export function AccountSettingsDialog(props: AccountSettingsDialogProps) {
  return (
    <AccountSettingsDialogView {...props} {...useAccountSettingsDialogViewModel(props.ticker)} />
  );
}
