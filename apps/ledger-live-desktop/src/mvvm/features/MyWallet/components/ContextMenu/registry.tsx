import React, { type ComponentType } from "react";
import BackupHub from "LLD/features/BackupHub";
import { useContextMenu } from "../ContextMenuContext";
import { MenuView } from "./views/Menu";
import { CONTEXT_MENU_VIEW, type ContextMenuView } from "./types";

function BackupHubScreen() {
  const { goBack, close } = useContextMenu();
  return <BackupHub onBack={goBack} onClose={close} />;
}

export const CONTEXT_MENU_REGISTRY: Record<ContextMenuView, ComponentType> = {
  [CONTEXT_MENU_VIEW.myWallet]: MenuView,
  [CONTEXT_MENU_VIEW.backupHub]: BackupHubScreen,
};
