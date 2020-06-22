// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import styles from "../../navigation/styles";
import Buy from "../../screens/Exchange/Buy";
import History from "../../screens/Exchange/History";
import LText from "../LText";

type TabLabelProps = {
  focused: boolean,
  color: string,
};

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
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            /** width has to be a little bigger to accomodate the switch in size between semibold to regular */
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("exchange.buy.tabTitle")}
            </LText>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.ExchangeHistory}
        component={History}
        options={{
          title: t("exchange.history.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("exchange.history.tabTitle")}
            </LText>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator();
