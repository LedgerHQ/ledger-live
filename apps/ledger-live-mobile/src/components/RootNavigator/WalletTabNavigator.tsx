import React, { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Box } from "@ledgerhq/native-ui";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainerEventMap } from "@react-navigation/native";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import { PortfolioBalanceSync } from "LLM/features/Portfolio/components/PortfolioBalanceSync";
import {
  Portfolio as NewPortfolio,
  ReadOnlyPortfolio as NewReadOnlyPortfolio,
} from "LLM/features/Portfolio";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { ScreenName } from "~/const/navigation";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import Portfolio from "~/screens/Portfolio";
import ReadOnlyPortfolio from "~/screens/Portfolio/ReadOnly";
import WalletTabBackgroundGradient from "../WalletTab/WalletTabBackgroundGradient";
import WalletTabHeader from "../WalletTab/WalletTabHeader";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import { WalletTabNavigatorStackParamList } from "./types/WalletTabNavigator";

const WalletTab = createMaterialTopTabNavigator<WalletTabNavigatorStackParamList>();

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
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const { t } = useTranslation();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();

  const {
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

  const initialRouteName = ScreenName.Portfolio;

  return (
    <WalletTabNavigatorScrollManager currentRouteName={currentRouteName}>
      <PortfolioBalanceSync />
      <Box flexGrow={1} bg={backgroundColor}>
        <WalletTabBackgroundGradient />
        <WalletTab.Navigator
          initialRouteName={initialRouteName}
          tabBar={noTabBar}
          style={styles.navigator}
          screenOptions={screenOptions}
          screenListeners={{
            state: (e: { data: NavigationContainerEventMap["state"]["data"] }) => {
              const data = e.data;
              if (data?.state?.routeNames && (data?.state?.index || data?.state?.index === 0)) {
                setCurrentRouteName(data.state.routeNames[data.state.index]);
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
        </WalletTab.Navigator>
        <WalletTabHeader hidePortfolio={false} useWallet40TopBar={shouldDisplayWallet40TopBar} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
