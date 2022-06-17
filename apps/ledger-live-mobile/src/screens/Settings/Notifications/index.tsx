import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import { TrackScreen } from "../../../analytics";
import { notificationsSelector } from "../../../reducers/settings";
import { setNotifications } from "../../../actions/settings";
import { useTranslation } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import Track from "../../../analytics/Track";
import { State } from "../../../reducers";
import { Box, Switch, Text, Button } from "@ledgerhq/native-ui";

type NotificationRowProps = {
  disabled?: boolean;
  notificationKey: keyof State["settings"]["notifications"];
  label?: string;
};

function NotificationSettingsRow({
  disabled,
  notificationKey,
  label,
}: NotificationRowProps) {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);

  const { t } = useTranslation();

  const onChange = useCallback(
    (value: boolean) => {
      dispatch(
        setNotifications({
          [notificationKey]: value,
        }),
      );
    },
    [dispatch],
  );

  return (
    <SettingsRow
      event="TransactionsRow"
      title={t(`settings.notifications.${notificationKey}.title`)}
      desc={t(`settings.notifications.${notificationKey}.desc`)}
      label={label}
    >
      <Track
        event={
          notifications.transactions
            ? `Enable${notificationKey}Notifications`
            : `Disable${notificationKey}Notifications`
        }
        onUpdate
      />
      <Switch
        checked={notifications[notificationKey]}
        disabled={disabled}
        onChange={onChange}
      />
    </SettingsRow>
  );
}

function NotificationsSettings() {
  const { t } = useTranslation();
  const notifications = useSelector(notificationsSelector);

  const disableSubSettings = !notifications.allowed;

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Notifications" />
      <Box p={6} bg={"neutral.c30"} mx={6} borderRadius={2}>
        <Text
          color={"neutral.c100"}
          variant={"large"}
          fontWeight={"semiBold"}
          mb={2}
        >
          Your notifications are disabled
        </Text>
        <Text color={"neutral.c70"} variant={"bodyLineHeight"}>
          iOS is blocking notifications from Ledger Live. To get notifications
          on your phone, visit your device’s settings to turn on Ledger Live
          notifications.
        </Text>
        <Button type={"main"} mt={6}>
          Go to system settings
        </Button>
      </Box>
      <NotificationSettingsRow notificationKey={"allowed"} />
      <Box opacity={notifications.allowed ? 1 : 0.2}>
        <NotificationSettingsRow
          notificationKey={"announcement"}
          disabled={disableSubSettings}
        />
        <NotificationSettingsRow
          notificationKey={"transactions"}
          label={t(`common.comingSoon`)}
          disabled={disableSubSettings}
        />
        <NotificationSettingsRow
          notificationKey={"market"}
          label={t(`common.comingSoon`)}
          disabled={disableSubSettings}
        />
        <NotificationSettingsRow
          notificationKey={"price"}
          label={t(`common.comingSoon`)}
          disabled={disableSubSettings}
        />
      </Box>
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
