import { useSettings } from "LLD/components/TopBar/hooks/useSettings";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import type { TopBarAction } from "LLD/components/TopBar/types";
import { track } from "~/renderer/analytics/segment";
import { useContextMenuClose } from "../../ContextMenuContext";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";

const useTopBarViewModel = () => {
  const close = useContextMenuClose();
  const {
    handleSettings,
    settingsIcon,
    tooltip: settingsTooltip,
  } = useSettings(MY_WALLET_TRACKING_PAGE_NAME);
  const {
    tooltip: notificationTooltip,
    icon: notificationIcon,
    isInteractive: notificationIsInteractive,
    onClick: handleOpenNotificationCenter,
  } = useNotificationIndicator();

  const onSettingsClick = () => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.settings,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    handleSettings();
    close();
  };

  const onNotificationClick = () => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.notifications,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    handleOpenNotificationCenter();
    close();
  };

  const settingsAction: TopBarAction = {
    label: "settings",
    tooltip: settingsTooltip,
    icon: settingsIcon,
    isInteractive: true,
    onClick: onSettingsClick,
  };

  const notificationAction: TopBarAction = {
    label: "notifications",
    tooltip: notificationTooltip,
    icon: notificationIcon,
    isInteractive: notificationIsInteractive,
    onClick: onNotificationClick,
  };

  return {
    settingsAction,
    notificationAction,
  };
};

export default useTopBarViewModel;
