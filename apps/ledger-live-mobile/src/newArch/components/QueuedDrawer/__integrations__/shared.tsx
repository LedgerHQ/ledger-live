import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import {
  EmptyScreen,
  MainTestScreen,
  TestScreenWithDrawerForcingToBeOpened,
  TestScreenWithDrawerRequestingToBeOpened,
} from "../TestScreens";
import DebugAppLevelDrawer from "../DebugAppLevelDrawer";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
//import { UnmountOnBlur } from "~/components/RootNavigator/utils/UnmountOnBlur";

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

// const unmountOnBlur = ({ children }: { children: React.ReactNode }) => (
//   <UnmountOnBlur>{children}</UnmountOnBlur>
// );

export function TestPages() {
  return (
    <>
      <DebugAppLevelDrawer />
      <Stack.Navigator
        initialRouteName={ScreenName.DebugQueuedDrawers}
        screenOptions={{ animation: "none" }}
      >
        <Stack.Screen
          name={ScreenName.DebugQueuedDrawers}
          component={MainTestScreen}
          options={{ title: "Main screen" }}
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
    </>
  );
}
