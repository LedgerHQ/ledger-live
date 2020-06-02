// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import styles from "../../navigation/styles";
import Buy from "../../screens/Exchange/Buy";
import History from "../../screens/Exchange/History";

export default function CryptoAssetsSettingsNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBarOptions={{
        headerStyle: styles.headerNoShadow,
      }}
    >
      <Tab.Screen
        name={ScreenName.ExchangeBuy}
        component={Buy}
        options={{ title: t("exchange.buy.tabTitle") }}
      />
      <Tab.Screen
        name={ScreenName.ExchangeHistory}
        component={History}
        options={{ title: t("exchange.history.tabTitle") }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator();
