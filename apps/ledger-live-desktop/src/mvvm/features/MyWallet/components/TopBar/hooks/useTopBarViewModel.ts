import { useSettings } from "LLD/components/TopBar/hooks/useSettings";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import type { TopBarAction } from "LLD/components/TopBar/types";
import { useTranslation } from "react-i18next";
import { useContextMenuClose } from "../../ContextMenuContext";

const useTopBarViewModel = () => {
  const { t } = useTranslation();
  const close = useContextMenuClose();
  const { handleSettings, settingsIcon, tooltip: settingsTooltip } = useSettings("mywallet");
  const {
    tooltip: notificationTooltip,
    icon: notificationIcon,
    isInteractive: notificationIsInteractive,
    onClick: handleOpenNotificationCenter,
  } = useNotificationIndicator();

  const onSettingsClick = () => {
    handleSettings();
    close();
  };

  const onNotificationClick = () => {
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

  return { title: t("myWallet.title"), settingsAction, notificationAction };
};

export default useTopBarViewModel;
