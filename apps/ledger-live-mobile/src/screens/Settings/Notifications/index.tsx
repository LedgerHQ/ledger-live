import React, { useCallback, useState, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash/fp";
import { Box, Switch, Text, Button, IconsLegacy, InfiniteLoader } from "@ledgerhq/native-ui";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import SettingsRow from "~/components/SettingsRow";
import { track, TrackScreen, updateIdentify } from "~/analytics";
import { notificationsSelector } from "~/reducers/settings";
import { setNotifications } from "~/actions/settings";
import type { State } from "~/reducers/types";
import useNotifications from "~/logic/notifications";
import { updateUserPreferences } from "~/notifications/braze";

const notificationsMapping = {
  areNotificationsAllowed: "allowed",
  announcementsCategory: "announcements",
  recommendationsCategory: "recommendations",
  largeMoverCategory: "largeMover",
  transactionsAlertsCategory: "transactionsAlerts",
};

type NotificationRowProps = {
  disabled?: boolean;
  notificationKey: keyof State["settings"]["notifications"];
  label?: string;
};

function NotificationSettingsRow({ disabled, notificationKey, label }: NotificationRowProps) {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);

  const { t } = useTranslation();

  const translationKey = notificationsMapping[notificationKey];
  const capitalizedKey = capitalize(translationKey);

  const onChange = useCallback(
    (value: boolean) => {
      dispatch(
        setNotifications({
          [notificationKey]: value,
        }),
      );
      track("toggle_clicked", {
        toggle: `Toggle_${capitalizedKey === "Allowed" ? "Allow" : capitalizedKey}`,
        enabled: value,
      });
    },
    [capitalizedKey, dispatch, notificationKey],
  );

  return (
    <SettingsRow
      event={`${capitalizedKey}Row`}
      title={t(`settings.notifications.${translationKey}.title`)}
      desc={t(`settings.notifications.${translationKey}.desc`)}
      label={label}
    >
      <Switch checked={notifications[notificationKey]} disabled={disabled} onChange={onChange} />
    </SettingsRow>
  );
}

function NotificationsSettings() {
  const { t } = useTranslation();
  const notifications = useSelector(notificationsSelector);
  const {
    getIsNotifEnabled,
    handlePushNotificationsPermission,
    pushNotificationsOldRoute,
    notificationsCategoriesHidden,
  } = useNotifications();
  const [isNotifPermissionEnabled, setIsNotifPermissionEnabled] = useState<boolean | undefined>();

  const refreshNotifPermission = useCallback(() => {
    getIsNotifEnabled().then(isNotifPermissionEnabled => {
      setIsNotifPermissionEnabled(isNotifPermissionEnabled);
    });
  }, [getIsNotifEnabled, setIsNotifPermissionEnabled]);

  const allowPushNotifications = useCallback(() => {
    track("button_clicked", {
      button: "Go to system settings",
      page: pushNotificationsOldRoute,
    });
    handlePushNotificationsPermission();
  }, [pushNotificationsOldRoute, handlePushNotificationsPermission]);

  useEffect(() => {
    const interval = setInterval(refreshNotifPermission, 500);

    return () => {
      clearInterval(interval);
    };
  }, [refreshNotifPermission]);

  // Refresh user properties and send them to Segment when notifications preferences are updated
  // Also send user notifications preferences to Braze when updated
  useEffect(() => {
    updateIdentify();
    updateUserPreferences(notifications);
  }, [notifications]);

  const disableSubSettings = !notifications.areNotificationsAllowed;

  const platformData = useMemo(
    () =>
      Platform.OS === "ios"
        ? {
            osName: "iOS",
            ctaTransKey: "turnOnNotif",
            ctaIcon: IconsLegacy.NotificationsMedium,
          }
        : {
            osName: "Android",
            ctaTransKey: "goToSettings",
            ctaIcon: IconsLegacy.SettingsMedium,
          },
    [],
  );

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Notifications" />
      {isNotifPermissionEnabled === null || isNotifPermissionEnabled === undefined ? (
        <InfiniteLoader />
      ) : (
        <Box>
          {!isNotifPermissionEnabled ? (
            <Box p={6} bg={"neutral.c30"} mx={6} borderRadius={2}>
              <Text color={"neutral.c100"} variant={"large"} fontWeight={"semiBold"} mb={2}>
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
                onPress={allowPushNotifications}
                Icon={platformData.ctaIcon}
                iconPosition={"left"}
              >
                {t(`settings.notifications.disabledNotifications.${platformData.ctaTransKey}`)}
              </Button>
            </Box>
          ) : null}
          <Box opacity={isNotifPermissionEnabled ? 1 : 0.2}>
            <NotificationSettingsRow
              notificationKey={"areNotificationsAllowed"}
              disabled={!isNotifPermissionEnabled}
            />
          </Box>
          <Box
            opacity={isNotifPermissionEnabled && notifications.areNotificationsAllowed ? 1 : 0.2}
          >
            {!notificationsCategoriesHidden ||
            !notificationsCategoriesHidden.includes("announcementsCategory") ? (
              <NotificationSettingsRow
                notificationKey={"announcementsCategory"}
                disabled={disableSubSettings}
              />
            ) : null}
            {!notificationsCategoriesHidden ||
            !notificationsCategoriesHidden.includes("recommendationsCategory") ? (
              <NotificationSettingsRow
                notificationKey={"recommendationsCategory"}
                disabled={disableSubSettings}
              />
            ) : null}
            {!notificationsCategoriesHidden ||
            !notificationsCategoriesHidden.includes("largeMoverCategory") ? (
              <NotificationSettingsRow
                notificationKey={"largeMoverCategory"}
                disabled={disableSubSettings}
              />
            ) : null}
            {!notificationsCategoriesHidden ||
            !notificationsCategoriesHidden.includes("transactionsAlertsCategory") ? (
              <NotificationSettingsRow
                notificationKey={"transactionsAlertsCategory"}
                disabled={disableSubSettings}
              />
            ) : null}
          </Box>
          <Box m={6}>
            <Text color="neutral.c70" variant="small" textAlign="center">
              {t("settings.notifications.disclaimer")}
            </Text>
          </Box>
        </Box>
      )}
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
