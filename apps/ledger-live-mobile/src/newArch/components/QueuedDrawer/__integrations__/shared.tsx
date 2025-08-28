import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueuedDrawersContextProvider from "../QueuedDrawersContextProvider";
import { ScreenName } from "~/const";
import {
  EmptyScreen,
  MainTestScreen,
  TestScreenWithDrawerForcingToBeOpened,
  TestScreenWithDrawerRequestingToBeOpened,
} from "../TestScreens";
import DebugAppLevelDrawer from "../DebugAppLevelDrawer";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { UnmountOnBlur } from "~/components/RootNavigator/utils/UnmountOnBlur";

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

const unmountOnBlur = ({ children }: { children: React.ReactNode }) => (
  <UnmountOnBlur>{children}</UnmountOnBlur>
);

export function TestPages() {
  return (
    <QueuedDrawersContextProvider>
      <DebugAppLevelDrawer />
      {/* Disable animations in tests to avoid duplicated headers during transitions (RN v7) */}
      <Stack.Navigator
        initialRouteName={ScreenName.DebugQueuedDrawers}
        screenOptions={{ animation: "none" }}
        screenLayout={unmountOnBlur}
      >
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawers}
          component={MainTestScreen}
          options={{ title: "Main screen" }}
          layout={unmountOnBlur}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen0}
          component={EmptyScreen}
          options={{ title: "Empty screen" }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen1}
          component={TestScreenWithDrawerRequestingToBeOpened}
          options={{ title: "Screen 1" }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen2}
          component={TestScreenWithDrawerForcingToBeOpened}
          options={{ title: "Screen 2" }}
        />
      </Stack.Navigator>
    </QueuedDrawersContextProvider>
  );
}
