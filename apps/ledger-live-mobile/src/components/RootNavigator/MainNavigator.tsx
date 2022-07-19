// @flow
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { Icons } from "@ledgerhq/native-ui";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenName, NavigatorName } from "../../const";
import { PortfolioTabIcon } from "../../screens/Portfolio";
import Transfer, { TransferTabIcon } from "../TabBar/Transfer";
import TabIcon from "../TabIcon";
import MarketNavigator from "./MarketNavigator";
import PortfolioNavigator from "./PortfolioNavigator";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../../reducers/settings";
import ManagerNavigator, { ManagerTabIcon } from "./ManagerNavigator";
import DiscoverNavigator from "./DiscoverNavigator";
import customTabBar from "../TabBar/CustomTabBar";

const Tab = createBottomTabNavigator();

type RouteParams = {
  hideTabNavigation?: boolean;
};
export default function MainNavigator({
  route: { params },
}: {
  route: { params: RouteParams };
}) {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const { hideTabNavigation } = params || {};

  const insets = useSafeAreaInsets();
  const tabBar = useMemo(
    () => ({ ...props }) => customTabBar({ ...props, colors, insets }),
    [insets, colors],
  );
  return (
    <Tab.Navigator
      tabBar={tabBar}
      screenOptions={{
        tabBarStyle: [
          {
            height: 300,
            borderTopColor: colors.neutral.c30,
            borderTopWidth: 1,
            elevation: 5,
            shadowColor: colors.neutral.c30,
            backgroundColor: colors.background.main,
          },
          hideTabNavigation ? { display: "none" } : {},
        ],

        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.palette.primary.c80,
        tabBarInactiveTintColor: colors.palette.neutral.c70,
        headerShown: false,
      }}
      sceneContainerStyle={[{ backgroundColor: colors.background.main }]}
    >
      <Tab.Screen
        name={NavigatorName.Portfolio}
        component={PortfolioNavigator}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: (props: any) => <PortfolioTabIcon {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            // NB The default behaviour is not reset route params, leading to always having the same
            // search query or preselected tab after the first time (ie from Swap/Sell)
            // https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152
            navigation.navigate(NavigatorName.Portfolio, {
              screen: ScreenName.Portfolio,
            });
          },
        })}
      />
      <Tab.Screen
        name={NavigatorName.Market}
        component={MarketNavigator}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: (props: any) => (
            <TabIcon
              Icon={Icons.GraphGrowMedium}
              i18nKey="tabs.market"
              {...props}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            // NB The default behaviour is not reset route params, leading to always having the same
            // search query or preselected tab after the first time (ie from Swap/Sell)
            // https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152
            navigation.navigate(NavigatorName.Market, {
              screen: ScreenName.MarketList,
            });
          },
        })}
      />

      <Tab.Screen
        name={ScreenName.Transfer}
        component={Transfer}
        options={{
          headerShown: false,
          tabBarIcon: (props: any) => <TransferTabIcon {...props} />,
        }}
      />
      <Tab.Screen
        name={NavigatorName.Discover}
        component={DiscoverNavigator}
        options={{
          headerShown: false,
          tabBarIcon: (props: any) => (
            <TabIcon
              Icon={Icons.PlanetMedium}
              i18nKey="tabs.discover"
              {...props}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            // NB The default behaviour is not reset route params, leading to always having the same
            // search query or preselected tab after the first time (ie from Swap/Sell)
            // https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152
            navigation.navigate(NavigatorName.Discover, {
              screen: ScreenName.DiscoverScreen,
            });
          },
        })}
      />
      <Tab.Screen
        name={NavigatorName.Manager}
        component={ManagerNavigator}
        options={{
          tabBarIcon: (props: any) => <ManagerTabIcon {...props} />,
          tabBarTestID: "TabBarManager",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            if (hasOrderedNano) {
              navigation.navigate(ScreenName.PostBuyDeviceSetupNanoWallScreen);
            } else if (readOnlyModeEnabled) {
              navigation.navigate(NavigatorName.BuyDevice);
            } else {
              // NB The default behaviour is not reset route params, leading to always having the same
              // search query or preselected tab after the first time (ie from Swap/Sell)
              // https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152
              navigation.navigate(NavigatorName.Manager, {
                screen: ScreenName.Manager,
                params: {
                  tab: undefined,
                  searchQuery: undefined,
                  updateModalOpened: undefined,
                },
              });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}
