import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Bell, BellNotification, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { useMyWalletHeaderViewModel } from "./useMyWalletHeaderViewModel";

export function MyWalletHeaderTrailing() {
  const { t } = useTranslation();
  const { onNotificationsPress, onSettingsPress, hasUnreadNotifications } =
    useMyWalletHeaderViewModel();

  const NotificationIcon = hasUnreadNotifications ? BellNotification : Bell;

  return (
    <>
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
    </>
  );
}
