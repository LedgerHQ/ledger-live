import React from "react";
import { AccountSettingsSheetView } from "./AccountSettingsSheetView";
import type { AccountSettingsSheetProps } from "./types";
import { useAccountSettingsSheetViewModel } from "./useAccountSettingsSheetViewModel";

export function AccountSettingsSheet(props: AccountSettingsSheetProps) {
  return (
    <AccountSettingsSheetView {...props} {...useAccountSettingsSheetViewModel(props.account)} />
  );
}
