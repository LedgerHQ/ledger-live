import React from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NavigatorName } from "~/const";
import { afterFirstHomeLayout } from "LLM/utils/startupTimeMarkerState";
import { isGetComponentEnabled } from "LLM/utils/perfOptimizationMode";
import PortfolioNavigator from "../PortfolioNavigator";
import { scheduleNamedPreloads } from "../lazyScreen";
import { Tab } from "./tabNavigator";
import type { MainNavigatorParamList } from "../types/MainNavigator";
import type { Wallet40TabNavigatorProps } from "./types";

let tabScreensPreloaded = false;

function preloadSiblingTabs(
  navigation: BottomTabNavigationProp<MainNavigatorParamList>,
  isPayTabEnabled: boolean,
) {
  if (tabScreensPreloaded || !isGetComponentEnabled()) {
    return;
  }
  tabScreensPreloaded = true;
  afterFirstHomeLayout(() => {
    scheduleNamedPreloads(
      [
        NavigatorName.Swap,
        NavigatorName.Earn,
        isPayTabEnabled ? NavigatorName.PayTab : NavigatorName.CardTab,
      ],
      name => {
        navigation.preload(name as keyof MainNavigatorParamList);
      },
      700,
      450,
    );
  });
}

function Wallet40SwapTabHeader() {
  const { SwapWallet40Header } =
    require("~/screens/Swap/LiveApp/components/SwapWallet40Header") as typeof import("~/screens/Swap/LiveApp/components/SwapWallet40Header");
  return <SwapWallet40Header />;
}

function resetSwapWallet40HeaderStateOnTabPress() {
  (
    require("~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState") as typeof import("~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState")
  ).resetSwapWallet40HeaderState();
}

export function Wallet40TabNavigator({
  tabBar,
  screenOptions,
  isPayTabEnabled,
}: Readonly<Wallet40TabNavigatorProps>): React.JSX.Element {
  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen
        name={NavigatorName.Portfolio}
        component={PortfolioNavigator}
        listeners={({ navigation }) => ({
          focus: () => preloadSiblingTabs(navigation, isPayTabEnabled),
        })}
      />
      <Tab.Screen
        name={NavigatorName.Swap}
        getComponent={() => require("../SwapNavigator").default}
        options={{
          header: Wallet40SwapTabHeader,
        }}
        listeners={() => ({
          tabPress: resetSwapWallet40HeaderStateOnTabPress,
        })}
      />
      <Tab.Screen
        name={NavigatorName.Earn}
        getComponent={() => require("../EarnLiveAppNavigator").default}
      />
      {isPayTabEnabled ? (
        <Tab.Screen
          name={NavigatorName.PayTab}
          getComponent={() => require("LLM/features/PayTab").default}
          options={props =>
            (
              require("LLM/features/PayTab/getPayTabScreenOptions") as typeof import("LLM/features/PayTab/getPayTabScreenOptions")
            ).getPayTabScreenOptions(props)
          }
        />
      ) : (
        <Tab.Screen
          name={NavigatorName.CardTab}
          getComponent={() => require("LLM/features/Card").default}
        />
      )}
    </Tab.Navigator>
  );
}
