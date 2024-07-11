import React from "react";
import WalletSyncActivation from "LLM/features/WalletSync/screens/Activation";
import { createStackNavigator } from "@react-navigation/stack";
import WalletSyncActivationDeviceSelection from "./screens/DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { Success } from "./screens/Success";

interface NavigatorProps {
  Stack: ReturnType<typeof createStackNavigator<WalletSyncNavigatorStackParamList>>;
}

export default function WalletSyncNavigator({ Stack }: NavigatorProps) {
  return (
    <Stack.Group>
      <Stack.Screen
        name={ScreenName.WalletSyncActivationSettings}
        component={WalletSyncActivation}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletSyncActivationDeviceSelection}
        component={WalletSyncActivationDeviceSelection}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.WalletSyncSuccess}
        component={Success}
        options={{
          title: "",
          headerRight: () => null,
          headerLeft: () => null,
        }}
      />
    </Stack.Group>
  );
}
