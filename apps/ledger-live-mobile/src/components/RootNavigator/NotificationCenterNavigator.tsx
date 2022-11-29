import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import NotificationCenterStatus from "../../screens/NotificationCenter/Status";
import NotificationCenterNews from "../../screens/NotificationCenter/News";
import { ScreenName } from "../../const";
import type { NotificationCenterNavigatorParamList } from "./types/NotificationCenterNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { notificationsCardsSelector } from "../../reducers/dynamicContent";

const Stack = createStackNavigator<NotificationCenterNavigatorParamList>();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const notifications = useSelector(notificationsCardsSelector);
  const [notificationsCount] = useState(
    notifications.length - notifications.filter(n => n.viewed).length,
  );
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
          title: t(
            notificationsCount > 0
              ? "notificationCenter.news.titleCount"
              : "notificationCenter.news.title",
            {
              count: notificationsCount,
            },
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
