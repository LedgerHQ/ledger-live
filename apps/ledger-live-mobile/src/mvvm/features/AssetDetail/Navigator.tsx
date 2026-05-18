import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import AssetDetail from "./screens/AssetDetail";
import { AssetDetailNavigatorParamsList } from "./types";

const Stack = createLumenNativeStackNavigator<AssetDetailNavigatorParamsList>();

export default function AssetDetailNavigator() {
  const { theme } = useLumenTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen name={ScreenName.AssetDetail} component={AssetDetail} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
