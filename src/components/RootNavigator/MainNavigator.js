// @flow
import React from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "../../const";
import Portfolio from "../../screens/Portfolio";
import Transfer, { TransferTabIcon } from "../../screens/Transfer";
import AccountsNavigator from "./AccountsNavigator";
import ManagerNavigator, { ManagerTabIcon } from "./ManagerNavigator";
import PlatformNavigator from "./PlatformNavigator";
import TabIcon from "../TabIcon";
import MarketNavigator from "./MarketNavigator";
import Tab from "./CustomBlockRouterNavigator";

type RouteParams = {
  hideTabNavigation?: boolean,
};
export default function MainNavigator({
  route: { params },
}: {
  route: { params: RouteParams },
}) {
  const { colors } = useTheme();
  const { hideTabNavigation } = params || {};
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: [
          {
            borderTopColor: colors.lightFog,
            backgroundColor: colors.card,
          },
          hideTabNavigation ? { display: "none" } : {},
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.live,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name={ScreenName.Portfolio}
        component={Portfolio}
        options={{
          unmountOnBlur: true,
          tabBarIcon: (props: any) => (
            <TabIcon
              Icon={Icons.HouseMedium}
              i18nKey="tabs.portfolio"
              {...props}
            />
          ),
        }}
      />
      <Tab.Screen
        name={NavigatorName.Accounts}
        component={AccountsNavigator}
        listeners={({ route, navigation }) => ({
          tabPress: () => navigation.navigate(route.name),
        })}
        options={{
          unmountOnBlur: true,
          tabBarIcon: (props: any) => (
            <TabIcon
              Icon={Icons.WalletMedium}
              i18nKey="tabs.accounts"
              {...props}
            />
          ),
          tabBarTestID: "TabBarAccounts",
        }}
      />
      <Tab.Screen
        name={ScreenName.Transfer}
        component={Transfer}
        options={{
          headerShown: false,
          tabBarIcon: (props: any) => <TransferTabIcon {...props} />,
        }}
      />
      {Platform.OS === "android" ? (
        <Tab.Screen
          name={NavigatorName.Platform}
          component={PlatformNavigator}
          options={{
            headerShown: false,
            unmountOnBlur: true,
            tabBarIcon: (props: any) => (
              <TabIcon
                Icon={Icons.ManagerMedium}
                i18nKey="tabs.platform"
                {...props}
              />
            ),
          }}
        />
      ) : null}
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
      />
      {Platform.OS === "ios" ? (
        <Tab.Screen
          name={NavigatorName.Manager}
          component={ManagerNavigator}
          options={{
            tabBarIcon: (props: any) => <ManagerTabIcon {...props} />,
            tabBarTestID: "TabBarManager",
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
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
            },
          })}
        />
      ) : null}
    </Tab.Navigator>
  );
}
