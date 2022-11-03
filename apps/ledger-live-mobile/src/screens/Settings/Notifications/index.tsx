import React, { useCallback, useState, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash/fp";
import {
  Box,
  Switch,
  Text,
  Button,
  Icons,
  InfiniteLoader,
} from "@ledgerhq/native-ui";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import SettingsRow from "../../../components/SettingsRow";
import Track from "../../../analytics/Track";
import { track, TrackScreen } from "../../../analytics";
import { notificationsSelector } from "../../../reducers/settings";
import { setNotifications } from "../../../actions/settings";
import type { State } from "../../../reducers/types";
import useNotifications from "../../../logic/notifications";

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

  const capitalizedKey = capitalize(notificationKey);

  const onChange = useCallback(
    (value: boolean) => {
      dispatch(
        setNotifications({
          [notificationKey]: value,
        }),
      );
      track("toggle_clicked", {
        toggle: `Toggle_${
          capitalizedKey === "Allowed" ? "Allow" : capitalizedKey
        }`,
        enabled: value,
      });
    },
    [capitalizedKey, dispatch, notificationKey],
  );

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
  const { getIsNotifEnabled, handlePushNotificationsPermission } =
    useNotifications();
  const [isNotifPermissionEnabled, setIsNotifPermissionEnabled] =
    useState<boolean>(false);

  const refreshNotifPermission = useCallback(() => {
    getIsNotifEnabled().then(isNotifPermissionEnabled => {
      setIsNotifPermissionEnabled(isNotifPermissionEnabled);
    });
  }, [getIsNotifEnabled, setIsNotifPermissionEnabled]);

  useEffect(() => {
    const interval = setInterval(refreshNotifPermission, 500);

    return () => {
      clearInterval(interval);
    };
  }, [refreshNotifPermission]);

  const disableSubSettings = !notifications.allowed;

  const platformData = useMemo(
    () =>
      Platform.OS === "ios"
        ? {
            osName: "iOS",
            ctaTransKey: "turnOnNotif",
            ctaIcon: Icons.NotificationsMedium,
          }
        : {
            osName: "Android",
            ctaTransKey: "goToSettings",
            ctaIcon: Icons.SettingsMedium,
          },
    [],
  );

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Notifications" />
      {isNotifPermissionEnabled === null ||
      isNotifPermissionEnabled === undefined ? (
        <InfiniteLoader />
      ) : (
        <Box>
          {!isNotifPermissionEnabled ? (
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
                {t(`settings.notifications.disabledNotifications.desc`, {
                  platform: platformData.osName,
                })}
              </Text>
              <Button
                type={"main"}
                mt={6}
                onPress={handlePushNotificationsPermission}
                Icon={platformData.ctaIcon}
                iconPosition={"left"}
              >
                {t(
                  `settings.notifications.disabledNotifications.${platformData.ctaTransKey}`,
                )}
              </Button>
            </Box>
          ) : null}
          <Box opacity={isNotifPermissionEnabled ? 1 : 0.2}>
            <NotificationSettingsRow
              notificationKey={"allowed"}
              disabled={!isNotifPermissionEnabled}
            />
          </Box>
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
        </Box>
      )}
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
