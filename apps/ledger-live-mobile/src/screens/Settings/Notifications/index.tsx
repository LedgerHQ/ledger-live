import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash/fp";
import { Box, Switch, Text, Button } from "@ledgerhq/native-ui";
import { SettingsMedium } from "@ledgerhq/native-ui/assets/icons";

import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import SettingsRow from "../../../components/SettingsRow";
import Track from "../../../analytics/Track";
import { TrackScreen } from "../../../analytics";

import { notificationsSelector } from "../../../reducers/settings";
import { setNotifications } from "../../../actions/settings";
import { State } from "../../../reducers";

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
    [dispatch, notificationKey],
  );

  const capitalizedKey = capitalize(notificationKey);

  return (
    <SettingsRow
      event={`${capitalizedKey}Row`}
      title={t(`settings.notifications.${notificationKey}.title`)}
      desc={t(`settings.notifications.${notificationKey}.desc`)}
      label={label}
    >
      <Track
        event={
          notifications[notificationKey]
            ? `Enable${capitalizedKey}Notifications`
            : `Disable${capitalizedKey}Notifications`
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

  const openSettings = useCallback(() => Linking.openSettings(), []);

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
        <Button
          type={"main"}
          mt={6}
          onPress={openSettings}
          icon={SettingsMedium}
          iconPosition={"left"}
        >
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
