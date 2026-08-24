import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import { ScreenName } from "~/const";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

// Stub navigator reserved for LIVE-29098 (the "NeuronManageFlow"). Registered now so the
// "Manage Neurons" account action wired in LIVE-29097 has a navigation target. LIVE-29098 replaces
// the placeholder screen with the neuron list and per-action screens, reusing these names.
const PlaceholderScreen = () => <View style={{ flex: 1 }} />;

function NeuronManageFlow() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.InternetComputerNeuronList} component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

const options = { headerShown: false };

export { NeuronManageFlow as component, options };

const Stack = createNativeStackNavigator<InternetComputerNeuronManageFlowParamList>();
