import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { AGENT_INTENT_SOURCE } from "@features/platform-agent-intent-entry-points";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { AgentIntentPlaceholderScreen } from "./screens/AgentIntentPlaceholder";
import type { AgentIntentNavigatorParamList } from "./types";

const Stack = createLumenNativeStackNavigator<AgentIntentNavigatorParamList>();
const TabStack = createNativeStackNavigator<AgentIntentNavigatorParamList>();

export function AgentIntentNavigator() {
  const { theme } = useLumenTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, gestureEnabled: Platform.OS === "ios" }}
    >
      <Stack.Screen
        name={ScreenName.AgentIntent}
        component={AgentIntentPlaceholderScreen}
        options={{ headerShown: true, title: "" }}
      />
    </Stack.Navigator>
  );
}

export function AgentIntentTabNavigator() {
  return (
    <TabStack.Navigator screenOptions={{ headerShown: false }}>
      <TabStack.Screen
        name={ScreenName.AgentIntent}
        component={AgentIntentPlaceholderScreen}
        initialParams={{ source: AGENT_INTENT_SOURCE.navBar }}
      />
    </TabStack.Navigator>
  );
}
