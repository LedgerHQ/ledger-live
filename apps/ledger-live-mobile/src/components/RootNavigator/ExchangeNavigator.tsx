import React, { useMemo } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import Sell from "../../screens/Exchange/Sell";
import Buy from "../../screens/Exchange/Buy";
import { getLineTabNavigatorConfig } from "../../navigation/tabNavigatorConfig";
import type { ExchangeNavigatorParamList } from "./types/ExchangeNavigator";

type TabLabelProps = {
  focused: boolean;
  color: string;
};

export default function ExchangeNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const tabNavigationConfig = useMemo(
    () => getLineTabNavigatorConfig(colors),
    [colors],
  );
  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={ScreenName.ExchangeBuy}
        component={Buy}
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("exchange.buy.tabTitle")}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.ExchangeSell}
        component={Sell}
        options={{
          title: t("exchange.sell.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("exchange.sell.tabTitle")}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator<ExchangeNavigatorParamList>();
