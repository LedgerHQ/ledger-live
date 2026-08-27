import React from "react";
import { NavigatorName } from "~/const";
import PortfolioNavigator from "../PortfolioNavigator";
import { Tab } from "./tabNavigator";
import type { Wallet40TabNavigatorProps } from "./types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainNavigatorParamList } from "../types/MainNavigator";
import { scheduleNamedPreloads } from "../lazyScreen";

let didScheduleTabPreload = false;

function scheduleSiblingTabPreload(
  navigation: BottomTabNavigationProp<MainNavigatorParamList>,
  isPayTabEnabled: boolean,
): void {
  if (didScheduleTabPreload) {
    return;
  }
  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID) {
    return;
  }
  didScheduleTabPreload = true;
  scheduleNamedPreloads(
    [
      NavigatorName.Swap,
      NavigatorName.Earn,
      isPayTabEnabled ? NavigatorName.PayTab : NavigatorName.CardTab,
    ],
    name => {
      navigation.preload(name as keyof MainNavigatorParamList);
    },
  );
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
          focus: () => {
            scheduleSiblingTabPreload(navigation, isPayTabEnabled);
          },
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
