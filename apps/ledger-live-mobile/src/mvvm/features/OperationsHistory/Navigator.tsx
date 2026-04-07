import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { OperationsHistoryNavigatorParamsList } from "./types";
import OperationsList from "./screens/OperationsList";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation/getStackNavigationConfigV4";

export default function Navigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme, false), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.OperationsList}
        component={OperationsList}
        options={{
          title: t("analytics.operations.title"),
          headerRight: () => null,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<OperationsHistoryNavigatorParamsList>();
