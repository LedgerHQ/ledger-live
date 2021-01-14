// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import styles from "../../navigation/styles";
import Buy from "../../screens/Exchange/Buy";
import Sell from "../../screens/Exchange/Sell";
import History from "../../screens/Exchange/History";
import LText from "../LText";

type TabLabelProps = {
  focused: boolean,
  color: string,
};

export default function ExchangeNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBarOptions={{
        headerStyle: {
          ...styles.headerNoShadow,
          backgroundColor: colors.background,
        },
        indicatorStyle: {
          backgroundColor: colors.live,
        },
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
        name={ScreenName.ExchangeSell}
        component={Sell}
        options={{
          title: t("exchange.sell.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            /** width has to be a little bigger to accomodate the switch in size between semibold to regular */
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("exchange.sell.tabTitle")}
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
