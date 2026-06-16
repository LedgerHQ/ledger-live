import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useRecoverEntry } from "LLD/hooks/useRecoverEntry";
import { track } from "~/renderer/analytics/segment";
import { useContextMenu } from "../../../ContextMenuContext";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../../constants";
import { CONTEXT_MENU_VIEW } from "../../types";

export type MenuViewModel = {
  onRecoverClick: () => void;
};

export function useMenuViewModel(): MenuViewModel {
  const { navigateTo, close } = useContextMenu();
  const isBackupHubEnabled = !!useFeature("lwdBackupHub")?.enabled;
  const { markRecoverSeen, openRecover } = useRecoverEntry();

  const onRecoverClick = useCallback(() => {
    track("button_clicked", {
      button: isBackupHubEnabled
        ? MY_WALLET_TRACKING_BUTTON.backup
        : MY_WALLET_TRACKING_BUTTON.recover,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });

    if (isBackupHubEnabled) {
      markRecoverSeen();
      navigateTo(CONTEXT_MENU_VIEW.backupHub);
      return;
    }

    openRecover();
    close();
  }, [isBackupHubEnabled, markRecoverSeen, navigateTo, openRecover, close]);

  return { onRecoverClick };
}
