import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import NotificationCenterStatus from "../../screens/NotificationCenter/Status";
import NotificationCenterNews from "../../screens/NotificationCenter/Notifications";
import { ScreenName } from "../../const";
import type { NotificationCenterNavigatorParamList } from "./types/NotificationCenterNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

const Stack = createStackNavigator<NotificationCenterNavigatorParamList>();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.NotificationCenterNews}
        component={NotificationCenterNews}
        options={{
          title: t("notificationCenter.news.title"),
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
