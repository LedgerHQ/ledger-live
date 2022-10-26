import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { useDispatch, useSelector } from "react-redux";
import { NavigationContainerEventMap } from "@react-navigation/native";
import { Box } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import Portfolio from "../../screens/Portfolio";
import WalletNftGallery from "../../screens/Nft/WalletNftGallery";
import {
  readOnlyModeEnabledSelector,
  walletTabNavigatorLastVisitedTabSelector,
} from "../../reducers/settings";
import { accountsSelector } from "../../reducers/accounts";
// eslint-disable-next-line import/no-cycle
import ReadOnlyPortfolio from "../../screens/Portfolio/ReadOnly";
import { setWalletTabNavigatorLastVisitedTab } from "../../actions/settings";
import WalletTabNavigatorTabBar from "../WalletTab/WalletTabNavigatorTabBar";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import WalletTabHeader from "../WalletTab/WalletTabHeader";

const WalletTab = createMaterialTopTabNavigator();

const tabBarOptions = (props: MaterialTopTabBarProps) => (
  <WalletTabNavigatorTabBar {...props} />
);

const tabBarEmptyOptions = (props: MaterialTopTabBarProps) => null;

export default function WalletTabNavigator() {
  const dispatch = useDispatch();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accounts = useSelector(accountsSelector);
  const lastVisitedTab = useSelector(walletTabNavigatorLastVisitedTabSelector);

  const { t } = useTranslation();

  const [currentRouteName, setCurrentRouteName] = useState<
    string | undefined
  >();

  return (
    <WalletTabNavigatorScrollManager currentRouteName={currentRouteName}>
      <Box flex={1} bg={"background.main"}>
        <WalletTab.Navigator
          initialRouteName={lastVisitedTab}
          tabBar={false ? tabBarEmptyOptions : tabBarOptions}
          style={{ backgroundColor: "transparent" }}
          sceneContainerStyle={{ backgroundColor: "transparent" }}
          tabBarOptions={{ style: { backgroundColor: "transparent" } }}
          screenOptions={{
            lazy: true,
          }}
          screenListeners={{
            state: (e: NavigationContainerEventMap["state"]) => {
              if (
                e?.data?.state?.routeNames &&
                (e?.data?.state?.index || e?.data?.state?.index === 0)
              ) {
                setCurrentRouteName(
                  e.data.state.routeNames[e.data.state.index],
                );
                dispatch(
                  setWalletTabNavigatorLastVisitedTab(
                    e.data.state.routeNames[e.data.state.index],
                  ),
                );
              }
            },
          }}
        >
          <WalletTab.Screen
            name={ScreenName.Portfolio}
            component={
              readOnlyModeEnabled && accounts.length <= 0
                ? ReadOnlyPortfolio
                : Portfolio
            }
            options={{
              title: t("wallet.tabs.crypto"),
            }}
          />
          {true && (
            <WalletTab.Screen
              name={ScreenName.WalletNftGallery}
              component={WalletNftGallery}
              options={{
                title: t("wallet.tabs.nft"),
              }}
            />
          )}
        </WalletTab.Navigator>
        <WalletTabHeader hidePortfolio={false} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
