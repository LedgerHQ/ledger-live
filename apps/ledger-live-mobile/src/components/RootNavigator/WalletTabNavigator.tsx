import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import styled from "@ledgerhq/native-ui/components/styled";
import { Box, Flex } from "@ledgerhq/native-ui";
import { TabsContainer } from "@ledgerhq/native-ui/components/Tabs/TemplateTabs";
import { ChipTab } from "@ledgerhq/native-ui/components/Tabs/Chip";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { ScreenName } from "../../const";
import Portfolio from "../../screens/Portfolio";
import ReadOnlyPortfolio from "../../screens/Portfolio/ReadOnly";

const Tab = createMaterialTopTabNavigator();

const TabBarContainer = styled(Flex)`
  border-bottom-width: 1px;
  border-bottom-color: ${p => p.theme.colors.palette.neutral.c40};
  background-color: transparent;
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
              label={label || "Test"}
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

const TestNftGallery = () => {
  console.log("Test3red");
  return <Box bg={"red"} height={200} width={400} />;
};

export default function WalletTabNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        tabBarStyle: { backgroundColor: "red" },
      }}
      style={{ backgroundColor: "transparent" }}
      sceneContainerStyle={{ backgroundColor: "transparent" }}
      tabBarOptions={{ style: { backgroundColor: "transparent" } }}
      // lazy
      lazyPlaceholder={() => {
        console.log("PlaceHolderred");
        return <Box bg={"green"} height={200} width={400} />;
      }}
    >
      <Tab.Screen
        name={ScreenName.Portfolio}
        // component={
        //   readOnlyModeEnabled && accounts.length <= 0
        //     ? ReadOnlyPortfolio
        //     : Portfolio
        // }
        component={Portfolio}
      />
      <Tab.Screen
        name={ScreenName.WalletNftGallery}
        component={TestNftGallery}
      />
    </Tab.Navigator>
  );
}
