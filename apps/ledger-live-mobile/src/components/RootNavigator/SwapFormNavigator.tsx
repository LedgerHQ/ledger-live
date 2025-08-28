import { Text } from "@ledgerhq/native-ui";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getLineTabNavigatorConfig } from "~/navigation/tabNavigatorConfig";
import { SwapForm } from "~/screens/Swap";
import History from "~/screens/Swap/History";
import { SwapNavigatorParamList } from "../RootNavigator/types/SwapNavigator";
import type { StackNavigatorProps } from "../RootNavigator/types/helpers";
import { SwapFormNavigatorParamList } from "./types/SwapFormNavigator";

type TabLabelProps = {
  focused: boolean;
  color: string;
};

const Tab = createMaterialTopTabNavigator<SwapFormNavigatorParamList>();

export default function SwapFormNavigator({
  route: { params },
}: StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapTab>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tabNavigationConfig = useMemo(() => getLineTabNavigatorConfig(colors), [colors]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialParams = params as any;

  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={ScreenName.SwapForm}
        component={SwapForm}
        options={{
          title: t("transfer.swap.form.tab"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.form.tab")}
            </Text>
          ),
          tabBarButtonTestID: "swap-form-tab",
        }}
        initialParams={initialParams}
      />

      <Tab.Screen
        name={ScreenName.SwapHistory}
        component={History}
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.history.tab")}
            </Text>
          ),
          tabBarButtonTestID: "swap-history-tab",
        }}
      />
    </Tab.Navigator>
  );
}
