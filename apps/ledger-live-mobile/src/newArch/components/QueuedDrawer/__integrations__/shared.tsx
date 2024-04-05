import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import QueuedDrawersContextProvider from "../QueuedDrawersContextProvider";
import { ScreenName } from "~/const";
import {
  MainTestScreen,
  TestScreenWithDrawerForcingToBeOpened,
  TestScreenWithDrawerRequestingToBeOpened,
} from "../TestScreens";

const Stack = createStackNavigator<{
  [ScreenName.DebugQueuedDrawers]: undefined;
  [ScreenName.DebugQueuedDrawerScreen1]: undefined;
  [ScreenName.DebugQueuedDrawerScreen2]: undefined;
}>();

export function TestPages() {
  return (
    <QueuedDrawersContextProvider>
      <Stack.Navigator initialRouteName={ScreenName.DebugQueuedDrawers}>
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawers}
          component={MainTestScreen}
          options={{
            title: "QueuedDrawers",
          }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen1}
          component={TestScreenWithDrawerRequestingToBeOpened}
          options={{
            title: "QueuedDrawers (Auto open)",
          }}
        />
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawerScreen2}
          component={TestScreenWithDrawerForcingToBeOpened}
          options={{
            title: "QueuedDrawers (Auto force open)",
          }}
        />
      </Stack.Navigator>
    </QueuedDrawersContextProvider>
  );
}
