import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationCenterNavigatorParamList } from "~/components/RootNavigator/types/NotificationCenterNavigator";
import { ScreenName } from "~/const";
import NotificationCenter from "../Notifications";

const Stack = createNativeStackNavigator<NotificationCenterNavigatorParamList>();

export function NotificationCenterPages() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack.Navigator initialRouteName={ScreenName.NotificationCenter}>
        <Stack.Screen
          name={ScreenName.NotificationCenter}
          component={NotificationCenter}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
