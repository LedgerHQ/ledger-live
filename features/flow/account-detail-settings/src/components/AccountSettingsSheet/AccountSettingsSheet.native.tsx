import React from "react";
import { AccountSettingsSheetView } from "./AccountSettingsSheetView.native";
import type { AccountSettingsSheetProps } from "./types.native";
import { useAccountSettingsSheetViewModel } from "./useAccountSettingsSheetViewModel.native";

export function AccountSettingsSheet(props: AccountSettingsSheetProps) {
  return (
    <AccountSettingsSheetView {...props} {...useAccountSettingsSheetViewModel(props.account)} />
  );
}
