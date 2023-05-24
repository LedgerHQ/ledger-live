import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import ScanAccounts from "../../screens/ImportAccounts/Scan";
import DisplayResult from "../../screens/ImportAccounts/DisplayResult";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import type { ImportAccountsNavigatorParamList } from "./types/ImportAccountsNavigator";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";

export default function ImportAccountsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig }}>
      <Stack.Screen
        name={ScreenName.ScanAccounts}
        component={ScanAccounts}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerShown: true,
          headerTitle: () => (
            <Text variant="h3" uppercase>
              {t("account.import.scan.title")}
            </Text>
          ),
          headerRight: props => (
            <NavigationHeaderCloseButtonAdvanced {...props} color={"#fff"} />
          ),
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.DisplayResult}
        component={DisplayResult}
        options={{
          title: t("account.import.result.title"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ImportAccountsNavigatorParamList>();
