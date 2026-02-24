import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "~/const";
import { PortfolioTabIcon } from "~/screens/Portfolio";
import Transfer, { TransferTabIcon } from "~/components/TabBar/Transfer";
import TabIcon from "~/components/TabIcon";
import PortfolioNavigator from "../PortfolioNavigator";
import MyLedgerNavigator, { ManagerTabIcon } from "../MyLedgerNavigator";
import DiscoverNavigator from "../DiscoverNavigator";
import Web3HubTabNavigator from "LLM/features/Web3Hub/TabNavigator";
import EarnLiveAppNavigator from "../EarnLiveAppNavigator";
import { Tab } from "./tabNavigator";
import type { LegacyTabNavigatorProps } from "./types";

export function LegacyTabNavigator({
  tabBar,
  screenOptions,
  managerLockAwareCallback,
  readOnlyModeEnabled,
  hasOrderedNano,
  navigateToRebornFlow,
  openTransferDrawer,
  web3hubEnabled,
  earnYieldLabel,
}: LegacyTabNavigatorProps): React.JSX.Element {
  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen
        name={NavigatorName.Portfolio}
        component={PortfolioNavigator}
        options={{
          headerShown: false,
          tabBarIcon: props => <PortfolioTabIcon {...props} />,
          tabBarButtonTestID: "tab-bar-portfolio",
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              navigation.navigate(NavigatorName.Portfolio, {
                screen: NavigatorName.WalletTab,
              });
            });
          },
        })}
      />
      <Tab.Screen
        name={NavigatorName.Earn}
        component={EarnLiveAppNavigator}
        options={{
          freezeOnBlur: true,
          headerShown: false,
          tabBarIcon: props => (
            <TabIcon
              Icon={IconsLegacy.LendMedium}
              i18nKey={earnYieldLabel}
              testID="tab-bar-earn"
              {...props}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              if (readOnlyModeEnabled && hasOrderedNano) {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate(ScreenName.PostBuyDeviceSetupNanoWallScreen);
                }
              } else if (readOnlyModeEnabled) {
                navigateToRebornFlow();
              } else
                navigation.navigate(NavigatorName.Earn, {
                  screen: ScreenName.Earn,
                  params: {},
                });
            });
          },
        })}
      />
      <Tab.Screen
        name={ScreenName.Transfer}
        component={Transfer}
        options={{
          headerShown: false,
          tabBarIcon: () => <TransferTabIcon />,
        }}
        listeners={() => ({
          tabPress: e => {
            e.preventDefault();
            openTransferDrawer({ sourceScreenName: "MainTabBar" });
          },
        })}
      />
      {web3hubEnabled ? (
        <Tab.Screen
          name={NavigatorName.Web3HubTab}
          component={Web3HubTabNavigator}
          options={{
            headerShown: false,
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
            tabBarButtonTestID: "tab-bar-discover",
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              managerLockAwareCallback(() => {
                navigation.navigate(NavigatorName.Web3HubTab);
              });
            },
          })}
        />
      ) : (
        <Tab.Screen
          name={NavigatorName.Discover}
          component={DiscoverNavigator}
          options={{
            headerShown: false,
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
            tabBarButtonTestID: "tab-bar-discover",
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              managerLockAwareCallback(() => {
                navigation.navigate(NavigatorName.Discover, {
                  screen: ScreenName.DiscoverScreen,
                });
              });
            },
          })}
        />
      )}
      <Tab.Screen
        name={NavigatorName.MyLedger}
        component={MyLedgerNavigator}
        options={{
          headerShown: false,
          tabBarIcon: props => <ManagerTabIcon {...props} />,
          tabBarButtonTestID: "TabBarManager",
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            managerLockAwareCallback(() => {
              if (readOnlyModeEnabled && hasOrderedNano) {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate(ScreenName.PostBuyDeviceSetupNanoWallScreen);
                }
              } else if (readOnlyModeEnabled) {
                navigateToRebornFlow();
              } else {
                navigation.jumpTo(NavigatorName.MyLedger, {
                  screen: ScreenName.MyLedgerChooseDevice,
                  params: {
                    tab: undefined,
                    searchQuery: undefined,
                    updateModalOpened: undefined,
                  },
                });
              }
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}
