import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UpsellFlex from "../screens/UpsellFlex";

const Stack = createStackNavigator();

export const MockComponent = () => (
  <Stack.Navigator>
    <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
  </Stack.Navigator>
);
