import React from "react";
import { AccountSettingsDialogView } from "./AccountSettingsDialogView";
import type { AccountSettingsDialogProps } from "./types";
import { useAccountSettingsDialogViewModel } from "./useAccountSettingsDialogViewModel";

export function AccountSettingsDialog(props: AccountSettingsDialogProps) {
  return (
    <AccountSettingsDialogView {...props} {...useAccountSettingsDialogViewModel(props.ticker)} />
  );
}
