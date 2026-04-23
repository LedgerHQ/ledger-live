import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { OperationsHistoryNavigatorParamsList } from "./types";
import OperationsList from "./screens/OperationsList";

const Stack = createLumenNativeStackNavigator<OperationsHistoryNavigatorParamsList>();

export default function Navigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

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
        }}
      />
    </Stack.Navigator>
  );
}
