import React from "react";
import { AccountSettingsMenuView } from "./AccountSettingsMenuView";
import type { AccountSettingsMenuProps } from "./types";
import { useAccountSettingsMenuViewModel } from "./useAccountSettingsMenuViewModel";

export function AccountSettingsMenu(props: AccountSettingsMenuProps) {
  return <AccountSettingsMenuView {...props} {...useAccountSettingsMenuViewModel()} />;
}
