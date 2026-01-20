import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { capitalize } from "lodash/fp";
import { Box, Switch, Text, Button, IconsLegacy } from "@ledgerhq/native-ui";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import SettingsRow from "~/components/SettingsRow";
import { track, TrackScreen, trackWithRoute, updateIdentify } from "~/analytics";
import { notificationsSelector } from "~/reducers/settings";
import { setNotifications } from "~/actions/settings";
import type { State } from "~/reducers/types";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import { updateUserPreferences } from "~/notifications/braze";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useRoute } from "@react-navigation/core";

const notificationsMapping = {
  areNotificationsAllowed: "allowed",
  announcementsCategory: "announcements",
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
  const { resetOptOutState, permissionStatus, optOutOfNotifications } = useNotifications();

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

      if (notificationKey === "areNotificationsAllowed") {
        if (value === false) {
          optOutOfNotifications();
        }

        if (value === true) {
          if (permissionStatus === AuthorizationStatus.AUTHORIZED) {
            resetOptOutState();
          }
        }
      }

      track("toggle_clicked", {
        toggle: `Toggle_${capitalizedKey === "Allowed" ? "Allow" : capitalizedKey}`,
        enabled: value,
      });

      updateIdentify();
      updateUserPreferences({
        ...notifications,
        [notificationKey]: value,
      });
    },
    [
      dispatch,
      notificationKey,
      capitalizedKey,
      notifications,
      optOutOfNotifications,
      permissionStatus,
      resetOptOutState,
    ],
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
  const { permissionStatus, requestPushNotificationsPermission } = useNotifications();

  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const hiddenNotificationCategories = useMemo(() => {
    const hiddenCategories = [];
    const categoriesToHide = featureBrazePushNotifications?.params?.notificationsCategories ?? [];

    for (const notificationsCategory of categoriesToHide) {
      if (!notificationsCategory?.displayed) {
        hiddenCategories.push(notificationsCategory?.category || "");
      }
    }

    return hiddenCategories;
  }, [featureBrazePushNotifications?.params?.notificationsCategories]);

  const featureTransactionsAlerts = useFeature("transactionsAlerts");
  const route = useRoute();

  const allowPushNotifications = useCallback(() => {
    trackWithRoute("button_clicked", route, {
      button: "Go to system settings",
    });
    requestPushNotificationsPermission();
  }, [requestPushNotificationsPermission, route]);

  const isOsPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;

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

      <Box>
        {!isOsPermissionAuthorized ? (
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
        <Box opacity={isOsPermissionAuthorized ? 1 : 0.2}>
          <NotificationSettingsRow
            notificationKey={"areNotificationsAllowed"}
            disabled={!isOsPermissionAuthorized}
          />
        </Box>
        <Box opacity={isOsPermissionAuthorized && notifications.areNotificationsAllowed ? 1 : 0.2}>
          {hiddenNotificationCategories.includes("announcementsCategory") ? null : (
            <NotificationSettingsRow
              notificationKey={"announcementsCategory"}
              disabled={disableSubSettings}
            />
          )}
          {hiddenNotificationCategories.includes("largeMoverCategory") ? null : (
            <NotificationSettingsRow
              notificationKey={"largeMoverCategory"}
              disabled={disableSubSettings}
            />
          )}
          {featureTransactionsAlerts?.enabled &&
          hiddenNotificationCategories.includes("transactionsAlertsCategory") ? null : (
            <NotificationSettingsRow
              notificationKey={"transactionsAlertsCategory"}
              disabled={disableSubSettings}
            />
          )}
        </Box>
        <Box m={6}>
          <Text color="neutral.c70" variant="small" textAlign="center">
            {t("settings.notifications.disclaimer")}
          </Text>
        </Box>
      </Box>
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
