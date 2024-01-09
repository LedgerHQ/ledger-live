import React, { useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import { createStackNavigator } from "@react-navigation/stack";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";

import NotificationCenter from "~/screens/NotificationCenter/Notifications";
import { NavigatorName, ScreenName } from "~/const";
import type { NotificationCenterNavigatorParamList } from "./types/NotificationCenterNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import FullNodeWarning from "~/icons/FullNodeWarning";
import StatusCenter from "~/screens/NotificationCenter/Status";

const Stack = createStackNavigator<NotificationCenterNavigatorParamList>();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors, space } = useTheme();

  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const { incidents } = useFilteredServiceStatus();

  const goToNotificationsSettings = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
      page: ScreenName.NotificationCenter,
    });
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.NotificationsSettings,
    });
  }, [navigation]);

  const goToStatusCenter = useCallback(() => {
    track("button_clicked", {
      button: "Notification Center Status",
      page: ScreenName.NotificationCenterStatus,
    });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenterStatus,
    });
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.NotificationCenter}
        component={NotificationCenter}
        options={{
          title: t("notificationCenter.news.title"),
          headerRight: () => (
            <Flex flexDirection="row">
              {incidents.length > 0 && (
                <TouchableOpacity style={{ marginRight: space[6] }} onPress={goToStatusCenter}>
                  <FullNodeWarning
                    size={24}
                    color={colors.neutral.c100}
                    warningColor={colors.warning.c70}
                    backgroundColor={colors.background.main}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ marginRight: space[6] }}
                onPress={goToNotificationsSettings}
              >
                <IconsLegacy.SettingsMedium size={24} />
              </TouchableOpacity>
            </Flex>
          ),
        }}
      />

      <Stack.Screen
        name={ScreenName.NotificationCenterStatus}
        component={StatusCenter}
        options={{
          title: t("notificationCenter.status.header"),
        }}
      />
    </Stack.Navigator>
  );
}
