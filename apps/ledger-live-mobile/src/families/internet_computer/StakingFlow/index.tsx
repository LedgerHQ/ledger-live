import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import { ScreenName } from "~/const";
import type { InternetComputerStakingFlowParamList } from "./types";

// Stub navigator reserved for LIVE-29098 (the create-neuron "StakingFlow"). Registered now so the
// "Stake" account action wired in LIVE-29097 has a navigation target. LIVE-29098 replaces the
// placeholder screen with the real intro/amount/device/success steps, reusing these names.
const PlaceholderScreen = () => <View />;

function StakingFlow() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.InternetComputerStakingStarted} component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };

export { StakingFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerStakingFlowParamList>();
