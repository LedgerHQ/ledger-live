import React, { useMemo } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";
import { SwapForm, SwapFormNavParamList } from "../../screens/Swap";
import History from "../../screens/Swap/History";
import { getLineTabNavigatorConfig } from "../../navigation/tabNavigatorConfig";

type TabLabelProps = {
  focused: boolean;
  color: string;
};

export function SwapFormNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tabNavigationConfig = useMemo(
    () => getLineTabNavigatorConfig(colors),
    [colors],
  );

  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={"SwapForm"}
        component={SwapForm}
        options={{
          title: t("transfer.swap.form.tab"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.form.tab")}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={"SwapHistory"}
        component={History}
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.history.tab")}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator<SwapFormNavParamList>();
