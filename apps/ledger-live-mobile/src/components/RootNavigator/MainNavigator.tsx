import React, { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "~/context/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Web3HubTabNavigator from "LLM/features/Web3Hub/TabNavigator";
import { useManagerNavLockCallback } from "./CustomBlockRouterNavigator";
import { ScreenName, NavigatorName } from "~/const";
import { PortfolioTabIcon } from "~/screens/Portfolio";
import Transfer, { TransferTabIcon } from "../TabBar/Transfer";
import TabIcon from "../TabIcon";
import PortfolioNavigator from "./PortfolioNavigator";
import { hasOrderedNanoSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import MyLedgerNavigator, { ManagerTabIcon } from "./MyLedgerNavigator";
import DiscoverNavigator from "./DiscoverNavigator";
import customTabBar from "../TabBar/CustomTabBar";
import { MainTabBar } from "LLM/components/MainTabBar";
import { MainNavigatorParamList } from "./types/MainNavigator";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import EarnLiveAppNavigator from "./EarnLiveAppNavigator";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import { MainNavigatorTopBarHeader } from "./MainNavigatorTopBarHeader";
import { useTransferDrawerController } from "LLM/features/QuickActions";

const Tab = createBottomTabNavigator<MainNavigatorParamList>();

// NB The default behaviour is not reset route params, leading to always having the same
// search query or preselected tab after the first time (ie from Swap/Sell), that's why we
// override the navigation from tabs.
// https://github.com/react-navigation/react-navigation/issues/6674#issuecomment-562813152

export default function MainNavigator() {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const isMainNavigatorVisible = useSelector(isMainNavigatorVisibleSelector);
  const managerNavLockCallback = useManagerNavLockCallback();
  const web3hub = useFeature("web3hub");
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const earnYiedlLabel = getStakeLabelLocaleBased();
  const { navigateToRebornFlow } = useRebornFlow();
  const { openDrawer: openTransferDrawer } = useTransferDrawerController();

  const insets = useSafeAreaInsets();
  const tabBar = useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): React.JSX.Element =>
        shouldDisplayWallet40MainNav ? (
          <MainTabBar {...props} hideTabBar={!isMainNavigatorVisible} />
        ) : (
          customTabBar({
            ...props,
            colors,
            insets,
            hideTabBar: !isMainNavigatorVisible,
          })
        ),
    [colors, insets, isMainNavigatorVisible, shouldDisplayWallet40MainNav],
  );

  const managerLockAwareCallback = useCallback(
    (callback: () => void) => {
      // NB This is conditionally going to show the confirmation modal from the manager
      // in the event of having ongoing installs/uninstalls.
      if (managerNavLockCallback) {
        managerNavLockCallback(() => callback());
      } else {
        callback();
      }
    },
    [managerNavLockCallback],
  );

  const screenOptions = useMemo(
    () => ({
      sceneStyle: { backgroundColor: colors.background.main },
      tabBarStyle: [
        {
          height: 300,
          borderTopColor: colors.neutral.c30,
          borderTopWidth: 1,
          elevation: 5,
          shadowColor: colors.neutral.c30,
          backgroundColor: colors.opacityDefault.c10,
        },
      ],
      tabBarShowLabel: false,
      tabBarActiveTintColor: colors.primary.c80,
      tabBarInactiveTintColor: colors.neutral.c70,
      headerShown: shouldDisplayWallet40MainNav,
      headerTransparent: shouldDisplayWallet40MainNav,
      header: shouldDisplayWallet40MainNav ? () => <MainNavigatorTopBarHeader /> : undefined,
      popToTopOnBlur: true,
    }),
    [colors, shouldDisplayWallet40MainNav],
  );

  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen
        name={NavigatorName.Portfolio}
        component={PortfolioNavigator}
        options={{
          ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
          tabBarIcon: props => <PortfolioTabIcon {...props} />,
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
          ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
          tabBarIcon: props => (
            <TabIcon
              Icon={IconsLegacy.LendMedium}
              i18nKey={earnYiedlLabel}
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
          ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
          tabBarIcon: () => <TransferTabIcon />,
        }}
        listeners={() => ({
          tabPress: e => {
            e.preventDefault();
            openTransferDrawer({ sourceScreenName: "MainTabBar" });
          },
        })}
      />
      {web3hub?.enabled ? (
        <Tab.Screen
          name={NavigatorName.Web3HubTab}
          component={Web3HubTabNavigator}
          options={{
            ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
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
            ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
            tabBarIcon: props => (
              <TabIcon Icon={IconsLegacy.PlanetMedium} i18nKey="tabs.discover" {...props} />
            ),
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
          ...(!shouldDisplayWallet40MainNav && { headerShown: false }),
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
