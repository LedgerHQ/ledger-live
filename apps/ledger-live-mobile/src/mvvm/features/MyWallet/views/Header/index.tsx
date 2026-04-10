import React from "react";
import { IconButton, NavBar, NavBarBackButton, NavBarTrailing } from "@ledgerhq/lumen-ui-rnative";
import { Bell, BellNotification, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { useMyWalletHeaderViewModel } from "./useMyWalletHeaderViewModel";

export function MyWalletHeader() {
  const { t } = useTranslation();
  const { onBackPress, onNotificationsPress, onSettingsPress, hasUnreadNotifications } =
    useMyWalletHeaderViewModel();

  const NotificationIcon = hasUnreadNotifications ? BellNotification : Bell;

  return (
    <NavBar appearance="compact">
      <NavBarBackButton
        onPress={onBackPress}
        accessibilityLabel={t("common.back")}
        testID="my-wallet-header-back-button"
      />
      <NavBarTrailing>
        <IconButton
          appearance="no-background"
          size="md"
          icon={NotificationIcon}
          accessibilityLabel={t("notifications.title")}
          onPress={onNotificationsPress}
          testID="my-wallet-header-notifications-button"
        />
        <IconButton
          appearance="no-background"
          size="md"
          icon={Settings}
          accessibilityLabel={t("settings.title")}
          onPress={onSettingsPress}
          testID="my-wallet-header-settings-button"
        />
      </NavBarTrailing>
    </NavBar>
  );
}
