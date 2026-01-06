import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navigator from "../Navigator";
import TabNavigator from "../TabNavigator";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName } from "~/const";

const Stack = createNativeStackNavigator();

export function Web3HubTest() {
  // Create QueryClient inside useMemo to ensure stable reference
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack.Navigator initialRouteName={NavigatorName.Web3HubTab}>
        <Stack.Screen
          name={NavigatorName.Web3HubTab}
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Web3Hub}
          component={Navigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
