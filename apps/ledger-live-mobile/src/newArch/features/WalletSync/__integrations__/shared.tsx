import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import GeneralSettings from "~/screens/Settings/General";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import WalletSyncActivation from "../screens/Activation";

const Stack = createStackNavigator<SettingsNavigatorStackParamList & BaseNavigatorStackParamList>();

export function WalletSyncSettingsNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.GeneralSettings}>
      <Stack.Screen name={ScreenName.GeneralSettings} component={GeneralSettings} />
      <Stack.Screen
        name={ScreenName.WalletSyncActivationSettings}
        component={WalletSyncActivation}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
