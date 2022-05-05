import React, { useMemo } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

import AnalyticsAllocation from "../../screens/Analytics/Allocation";
import AnalyticsOperations from "../../screens/Analytics/Operations";
import { ScreenName } from "../../const";
import { getLineTabNavigatorConfig } from "../../navigation/tabNavigatorConfig";

const Tab = createMaterialTopTabNavigator();

export default function AnalyticsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tabNavigationConfig = useMemo(() => getLineTabNavigatorConfig(colors), [
    colors,
  ]);

  // Fixme Typescript: Update react-native-tab-view to 3.1.1 to remove Tab.navigator ts error
  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={ScreenName.AnalyticsAllocation}
        component={AnalyticsAllocation}
        options={{
          title: t("analytics.allocation.title"),
          tabBarLabel: (props: any) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("analytics.allocation.title")}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.AnalyticsOperations}
        component={AnalyticsOperations}
        options={{
          title: t("analytics.operations.title"),
          tabBarLabel: (props: any) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("analytics.operations.title")}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
