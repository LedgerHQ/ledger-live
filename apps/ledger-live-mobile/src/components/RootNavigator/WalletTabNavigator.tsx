import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { useDispatch, useSelector } from "react-redux";
import { NavigationContainerEventMap } from "@react-navigation/native";
import { Box } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import Portfolio from "~/screens/Portfolio";
import WalletNftGallery from "~/screens/Nft/WalletNftGallery";
import {
  readOnlyModeEnabledSelector,
  walletTabNavigatorLastVisitedTabSelector,
} from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import ReadOnlyPortfolio from "~/screens/Portfolio/ReadOnly";
import { setWalletTabNavigatorLastVisitedTab } from "~/actions/settings";
import WalletTabNavigatorTabBar from "../WalletTab/WalletTabNavigatorTabBar";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import WalletTabHeader from "../WalletTab/WalletTabHeader";
import WalletTabNavigatorTabBarDisabled from "../WalletTab/WalletTabNavigatorTabBarDisabled";
import { WalletTabNavigatorStackParamList } from "./types/WalletTabNavigator";
import { ScreenName, NavigatorName } from "~/const/navigation";
import MarketNavigator from "./MarketNavigator";

const WalletTab = createMaterialTopTabNavigator<WalletTabNavigatorStackParamList>();

const tabBarOptions = (props: MaterialTopTabBarProps) => <WalletTabNavigatorTabBar {...props} />;

const tabBarDisabledOptions = (props: MaterialTopTabBarProps) => (
  <WalletTabNavigatorTabBarDisabled {...props} />
);

export default function WalletTabNavigator() {
  const walletNftGalleryFeature = useFeature("walletNftGallery");
  const ptxEarnFeature = useFeature("ptxEarn");

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
          initialRouteName={
            walletNftGalleryFeature?.enabled ? lastVisitedTab : ScreenName.Portfolio
          }
          tabBar={walletNftGalleryFeature?.enabled ? tabBarOptions : tabBarDisabledOptions}
          style={{ backgroundColor: "transparent" }}
          sceneContainerStyle={{ backgroundColor: "transparent" }}
          screenOptions={{
            lazy: walletNftGalleryFeature?.params?.lazyLoadScreens ?? true,
            swipeEnabled: false, // For Contents Cards issue
          }}
          screenListeners={{
            state: e => {
              const data = e.data as NavigationContainerEventMap["state"]["data"];
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
          {walletNftGalleryFeature?.enabled && (
            <WalletTab.Screen
              name={ScreenName.WalletNftGallery}
              component={WalletNftGallery}
              options={{
                title: t("wallet.tabs.nft"),
              }}
            />
          )}
          {ptxEarnFeature?.enabled && (
            <WalletTab.Screen
              name={NavigatorName.Market}
              component={MarketNavigator}
              options={{
                title: t("wallet.tabs.market"),
              }}
            />
          )}
        </WalletTab.Navigator>
        <WalletTabHeader hidePortfolio={false} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
