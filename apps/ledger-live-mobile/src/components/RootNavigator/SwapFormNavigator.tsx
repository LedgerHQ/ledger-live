import { Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useTrack } from "~/analytics";
import { ScreenName } from "~/const";
import { getLineTabNavigatorConfig } from "~/navigation/tabNavigatorConfig";
import { SwapForm } from "~/screens/Swap";
import History from "~/screens/Swap/History";
import { SWAP_VERSION } from "~/screens/Swap/LiveApp/consts";
import { SwapNavigatorParamList } from "../RootNavigator/types/SwapNavigator";
import type { StackNavigatorProps } from "../RootNavigator/types/helpers";
import { SwapFormNavigatorParamList } from "./types/SwapFormNavigator";

type TabLabelProps = {
  focused: boolean;
  color: string;
};

const Tab = createMaterialTopTabNavigator<SwapFormNavigatorParamList>();

// Constants for tracking sources
const TRACKING_SOURCES = {
  Accounts: "Account",
  Main: "Portfolio",
  MarketDetail: "Assets",
};

// Helper function to determine tracking source based on route name
const getTrackingSource = (routeName: string) => {
  return Object.entries(TRACKING_SOURCES).find(([key]) => routeName.startsWith(key))?.[1];
};

export default function SwapFormNavigator({
  route: { params },
}: StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapTab>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navig = useNavigation();
  const tabNavigationConfig = useMemo(() => getLineTabNavigatorConfig(colors), [colors]);
  const track = useTrack();

  // Helper function to track button click
  const trackButtonClick = (source: string) => {
    track("button_clicked", {
      button: "swap",
      source,
      flow: "swap",
      swapVersion: SWAP_VERSION,
    });
  };

  useEffect(() => {
    const parentNavigator = navig.getParent();
    const navigationState = parentNavigator?.getState();

    if (!navigationState?.index || navigationState.index <= 0) {
      return;
    }

    const previousRoute = navigationState.routes[navigationState.index - 1];
    if (!previousRoute?.name) {
      return;
    }

    const source = getTrackingSource(previousRoute.name);
    if (source) {
      trackButtonClick(source);
    }
  }, [navig, trackButtonClick]);

  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={ScreenName.SwapForm}
        component={SwapForm}
        options={{
          title: t("transfer.swap.form.tab"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.form.tab")}
            </Text>
          ),
          tabBarTestID: "swap-form-tab",
        }}
        initialParams={{
          ...params,
        }}
      />

      <Tab.Screen
        name={ScreenName.SwapHistory}
        component={History}
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.history.tab")}
            </Text>
          ),
          tabBarTestID: "swap-history-tab",
        }}
      />
    </Tab.Navigator>
  );
}
