import React from "react";
import { ScreenName } from "~/const";
import WalletSyncActivation from "LLM/features/WalletSync/screens/Activation";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type WalletSyncNavigator = {
  [ScreenName.WalletSyncActivationSettings]: undefined;
};

interface NavigatorProps {
  Stack: ReturnType<typeof createStackNavigator<BaseNavigatorStackParamList>>;
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
    </Stack.Group>
  );
}
