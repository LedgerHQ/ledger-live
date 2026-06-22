import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { ScreenName } from "~/const";
import { GlobalSearch } from "./screens/GlobalSearch";
import type { GlobalSearchNavigatorParamList } from "./types";

const Stack = createLumenNativeStackNavigator<GlobalSearchNavigatorParamList>();

export default function GlobalSearchNavigator() {
  const { theme } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerShown: false,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen name={ScreenName.GlobalSearch} component={GlobalSearch} />
    </Stack.Navigator>
  );
}
