import React from "react";
import { AccountSettingsMenuView } from "./AccountSettingsMenuView";
import type { AccountSettingsMenuProps } from "./types";
import { useAccountSettingsMenuViewModel } from "./useAccountSettingsMenuViewModel";

export function AccountSettingsMenu({ explorerUrl, ...props }: AccountSettingsMenuProps) {
  return <AccountSettingsMenuView {...props} {...useAccountSettingsMenuViewModel(explorerUrl)} />;
}
