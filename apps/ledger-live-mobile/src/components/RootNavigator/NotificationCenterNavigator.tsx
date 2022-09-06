import React, { useState } from "react";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";

import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { TabsContainer } from "@ledgerhq/native-ui/components/Tabs/TemplateTabs";
import { ChipTab } from "@ledgerhq/native-ui/components/Tabs/Chip";
import NotificationCenterStatus from "../../screens/NotificationCenter/Status";
import NotificationCenterNews from "../../screens/NotificationCenter/News";
import { ScreenName } from "../../const";

const Tab = createMaterialTopTabNavigator();

const TabBarContainer = styled(Flex)`
  border-bottom-width: 1px;
  border-bottom-color: ${p => p.theme.colors.palette.neutral.c40};
  background-color: ${p => p.theme.colors.palette.background.main};
`;

function TabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  return (
    <TabBarContainer
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={4}
      paddingTop={4}
    >
      <TabsContainer>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title;

          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <ChipTab
              key={index}
              label={label || ""}
              isActive={isActive}
              index={index}
              onPress={onPress}
            />
          );
        })}
      </TabsContainer>
    </TabBarContainer>
  );
}

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const { allIds, seenIds } = useAnnouncements();
  const [notificationsCount] = useState(allIds.length - seenIds.length);

  // Fixme Typescript: Update react-native-tab-view to 3.1.1 to remove Tab.navigator ts error
  return (
    <>
      <Tab.Navigator tabBar={props => <TabBar {...props} />}>
        <Tab.Screen
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
        <Tab.Screen
          name={ScreenName.NotificationCenterStatus}
          component={NotificationCenterStatus}
          options={{
            title: t("notificationCenter.status.title"),
          }}
        />
      </Tab.Navigator>
    </>
  );
}
