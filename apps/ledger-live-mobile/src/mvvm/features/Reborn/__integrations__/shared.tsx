import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UpsellFlex from "../screens/UpsellFlex";

const Stack = createNativeStackNavigator();

export const MockComponent = () => (
  <Stack.Navigator>
    <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
  </Stack.Navigator>
);
