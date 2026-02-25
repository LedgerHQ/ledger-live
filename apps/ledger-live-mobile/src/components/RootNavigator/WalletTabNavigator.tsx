import React, { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Box } from "@ledgerhq/native-ui";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { NavigationContainerEventMap } from "@react-navigation/native";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import MarketWalletTabNavigator from "LLM/features/Market/WalletTabNavigator";
import {
  Portfolio as NewPortfolio,
  ReadOnlyPortfolio as NewReadOnlyPortfolio,
} from "LLM/features/Portfolio";
import { useTranslation } from "~/context/Locale";
import { useSelector, useDispatch } from "~/context/hooks";
import { setWalletTabNavigatorLastVisitedTab } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import {
  readOnlyModeEnabledSelector,
  walletTabNavigatorLastVisitedTabSelector,
} from "~/reducers/settings";
import Portfolio from "~/screens/Portfolio";
import ReadOnlyPortfolio from "~/screens/Portfolio/ReadOnly";
import WalletTabBackgroundGradient from "../WalletTab/WalletTabBackgroundGradient";
import WalletTabHeader from "../WalletTab/WalletTabHeader";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import WalletTabNavigatorTabBar from "../WalletTab/WalletTabNavigatorTabBar";
import { WalletTabNavigatorStackParamList } from "./types/WalletTabNavigator";

const WalletTab = createMaterialTopTabNavigator<WalletTabNavigatorStackParamList>();

const tabBar = (props: MaterialTopTabBarProps) => <WalletTabNavigatorTabBar {...props} />;
const noTabBar = () => null;

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

  const {
    shouldDisplayMarketBanner: shouldHideTabs,
    isEnabled: isNewPortfolioEnabled,
    shouldDisplayWallet40MainNav: shouldDisplayWallet40TopBar,
  } = useWalletFeaturesConfig("mobile");
  const { backgroundColor } = useWallet40Theme("mobile");

  const PortfolioComponent = useMemo(() => {
    if (readOnlyModeEnabled && hasNoAccounts) {
      return isNewPortfolioEnabled ? NewReadOnlyPortfolio : ReadOnlyPortfolio;
    }
    return isNewPortfolioEnabled ? NewPortfolio : Portfolio;
  }, [readOnlyModeEnabled, hasNoAccounts, isNewPortfolioEnabled]);

  // When tabs are hidden and user was previously on Market, show Portfolio instead.
  // Note: We intentionally don't dispatch to Redux here to avoid infinite loops
  // with screenListeners. Redux will be updated naturally when user navigates.
  const initialRouteName =
    shouldHideTabs && lastVisitedTab === NavigatorName.Market
      ? ScreenName.Portfolio
      : lastVisitedTab;

  return (
    <WalletTabNavigatorScrollManager currentRouteName={currentRouteName}>
      <Box flexGrow={1} bg={backgroundColor}>
        {shouldHideTabs && <WalletTabBackgroundGradient />}
        <WalletTab.Navigator
          initialRouteName={initialRouteName}
          tabBar={shouldHideTabs ? noTabBar : tabBar}
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
            component={PortfolioComponent}
            options={{
              title: t("wallet.tabs.crypto"),
            }}
          />

          {!shouldHideTabs && (
            <WalletTab.Screen
              name={NavigatorName.Market}
              component={MarketWalletTabNavigator}
              options={{
                title: t("wallet.tabs.market"),
              }}
            />
          )}
        </WalletTab.Navigator>
        <WalletTabHeader hidePortfolio={false} useWallet40TopBar={shouldDisplayWallet40TopBar} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
