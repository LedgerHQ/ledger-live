import { Box } from "@ledgerhq/native-ui";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { NavigationContainerEventMap } from "@react-navigation/native";
import MarketWalletTabNavigator from "LLM/features/Market/WalletTabNavigator";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setWalletTabNavigatorLastVisitedTab } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import {
  readOnlyModeEnabledSelector,
  walletTabNavigatorLastVisitedTabSelector,
} from "~/reducers/settings";
import Portfolio from "~/screens/Portfolio";
import ReadOnlyPortfolio from "~/screens/Portfolio/ReadOnly";
import WalletTabHeader from "../WalletTab/WalletTabHeader";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import WalletTabNavigatorTabBar from "../WalletTab/WalletTabNavigatorTabBar";
import { WalletTabNavigatorStackParamList } from "./types/WalletTabNavigator";

const WalletTab = createMaterialTopTabNavigator<WalletTabNavigatorStackParamList>();

const tabBar = (props: MaterialTopTabBarProps) => <WalletTabNavigatorTabBar {...props} />;

const styles = {
  navigator: { backgroundColor: "transparent" } satisfies StyleProp<ViewStyle>,
} as const;

const screenOptions = {
  lazy: true,
  swipeEnabled: false, // For Contents Cards issue
  sceneStyle: { backgroundColor: "transparent" },
} as const;

export default function WalletTabNavigator() {
  const dispatch = useDispatch();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const lastVisitedTab = useSelector(walletTabNavigatorLastVisitedTabSelector);
  const { t } = useTranslation();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();

  return (
    <WalletTabNavigatorScrollManager currentRouteName={currentRouteName}>
      <Box flexGrow={1} bg={"background.main"}>
        <WalletTab.Navigator
          initialRouteName={lastVisitedTab}
          tabBar={tabBar}
          style={styles.navigator}
          screenOptions={screenOptions}
          screenListeners={{
            state: (e: { data: NavigationContainerEventMap["state"]["data"] }) => {
              const data = e.data;
              if (data?.state?.routeNames && (data?.state?.index || data?.state?.index === 0)) {
                setCurrentRouteName(data.state.routeNames[data.state.index]);
                dispatch(
                  setWalletTabNavigatorLastVisitedTab(
                    data.state.routeNames[
                      data.state.index
                    ] as keyof WalletTabNavigatorStackParamList,
                  ),
                );
              }
            },
          }}
        >
          <WalletTab.Screen
            name={ScreenName.Portfolio}
            component={readOnlyModeEnabled && hasNoAccounts ? ReadOnlyPortfolio : Portfolio}
            options={{
              title: t("wallet.tabs.crypto"),
            }}
          />

          <WalletTab.Screen
            name={NavigatorName.Market}
            component={MarketWalletTabNavigator}
            options={{
              title: t("wallet.tabs.market"),
            }}
          />
        </WalletTab.Navigator>
        <WalletTabHeader hidePortfolio={false} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
