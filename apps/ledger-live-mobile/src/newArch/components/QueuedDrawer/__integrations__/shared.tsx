import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import QueuedDrawersContextProvider from "../QueuedDrawersContextProvider";
import { ScreenName } from "~/const";
import {
  EmptyScreen,
  MainTestScreen,
  TestScreenWithDrawerForcingToBeOpened,
  TestScreenWithDrawerRequestingToBeOpened,
} from "../TestScreens";
import DebugAppLevelDrawer from "../DebugAppLevelDrawer";

const Stack = createStackNavigator<{
  [ScreenName.DebugQueuedDrawers]: undefined;
  [ScreenName.DebugQueuedDrawerScreen0]: undefined;
  [ScreenName.DebugQueuedDrawerScreen1]: undefined;
  [ScreenName.DebugQueuedDrawerScreen2]: undefined;
}>();

export function TestPages() {
  return (
    <QueuedDrawersContextProvider>
      <DebugAppLevelDrawer />
      <Stack.Navigator initialRouteName={ScreenName.DebugQueuedDrawers}>
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawers}
          component={MainTestScreen}
          options={{
            title: "Main screen",
          }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen0}
          component={EmptyScreen}
          options={{
            title: "Empty screen",
          }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen1}
          component={TestScreenWithDrawerRequestingToBeOpened}
          options={{
            title: "Screen 1",
          }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen2}
          component={TestScreenWithDrawerForcingToBeOpened}
          options={{
            title: "Screen 2",
          }}
        />
      </Stack.Navigator>
    </QueuedDrawersContextProvider>
  );
}
