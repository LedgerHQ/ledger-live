import React, { useCallback, useMemo } from "react";
import { Linking, Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash/fp";
import { Box, Switch, Text, Button, Icons } from "@ledgerhq/native-ui";

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

  const platformData = useMemo(() => {
    return Platform.OS === "ios" ? {
      osName: "iOS",
      ctaTransKey: "iosCta",
      ctaIcon: Icons.SettingsMedium,
    } : {
      osName: "Android",
      ctaTransKey: "androidCta",
      ctaIcon: Icons.NotificationsMedium,
    };
  }, []);

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
          {t(`settings.notifications.disabledNotifications.title`)}
        </Text>
        <Text color={"neutral.c70"} variant={"bodyLineHeight"}>
          {t(`settings.notifications.disabledNotifications.desc`, { platform: platformData.osName })}
        </Text>
        <Button
          type={"main"}
          mt={6}
          onPress={openSettings}
          Icon={platformData.ctaIcon}
          iconPosition={"left"}
        >
          {t(`settings.notifications.disabledNotifications.${platformData.ctaTransKey}`)}
        </Button>
      </Box>
      <NotificationSettingsRow notificationKey={"allowed"} />
      <Box opacity={notifications.allowed ? 1 : 0.2}>
        <NotificationSettingsRow
          notificationKey={"announcement"}
          disabled={disableSubSettings}
        />
        {/* <NotificationSettingsRow
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
        /> */}
      </Box>
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
