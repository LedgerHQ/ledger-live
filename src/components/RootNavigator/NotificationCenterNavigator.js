// @flow
import React, { useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { ScreenName } from "../../const";
import styles from "../../navigation/styles";
import NotificationCenterNews from "../../screens/NotificationCenter/News";
import NotificationCenterStatus from "../../screens/NotificationCenter/Status";
import LText from "../LText";

type TabLabelProps = {
  focused: boolean,
  color: string,
};

const Tab = createMaterialTopTabNavigator();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { allIds, seenIds } = useAnnouncements();
  const [notificationsCount] = useState(allIds.length - seenIds.length);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: styles.headerNoShadow,
        tabBarIndicatorStyle: {
          backgroundColor: colors.live,
        },
      }}
    >
      <Tab.Screen
        name={ScreenName.NotificationCenterNews}
        component={NotificationCenterNews}
        options={{
          title: t("notificationCenter.news.title"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            // width has to be a little bigger to accomodate the switch in size between semibold to regular
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t(
                notificationsCount > 0
                  ? "notificationCenter.news.titleCount"
                  : "notificationCenter.news.title",
                {
                  count: notificationsCount,
                },
              )}
            </LText>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.NotificationCenterStatus}
        component={NotificationCenterStatus}
        options={{
          title: t("notificationCenter.status.title"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            //  width has to be a little bigger to accomodate the switch in size between semibold to regular
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("notificationCenter.status.title")}
            </LText>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
