import React, { useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import { createStackNavigator } from "@react-navigation/stack";
import { Icons } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import NotificationCenterStatus from "../../screens/NotificationCenter/Status";
import NotificationCenter from "../../screens/NotificationCenter/Notifications";
import { NavigatorName, ScreenName } from "../../const";
import type { NotificationCenterNavigatorParamList } from "./types/NotificationCenterNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { track } from "../../analytics";

const Stack = createStackNavigator<NotificationCenterNavigatorParamList>();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  const goToNotificationsSettings = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
      screen: ScreenName.NotificationCenter,
    });
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.NotificationsSettings,
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
            <TouchableOpacity
              style={{ marginRight: 24 }}
              onPress={goToNotificationsSettings}
            >
              <Icons.SettingsMedium size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NotificationCenterStatus}
        component={NotificationCenterStatus}
        options={{
          title: t("notificationCenter.status.title"),
        }}
      />
    </Stack.Navigator>
  );
}
