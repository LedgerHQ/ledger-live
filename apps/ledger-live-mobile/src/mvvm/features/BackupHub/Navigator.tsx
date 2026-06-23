import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { BackupHubScreen } from "./screens/BackupHubScreen";
import type { BackupHubNavigatorParamList } from "./types";

const Stack = createLumenNativeStackNavigator<BackupHubNavigatorParamList>();

const renderEmptyHeaderCenter = () => null;

export default function BackupHubNavigator() {
  const { theme } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.BackupHub}
        component={BackupHubScreen}
        options={{ title: "", lumenNavBar: { renderCenter: renderEmptyHeaderCenter } }}
      />
    </Stack.Navigator>
  );
}
