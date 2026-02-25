import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UpsellFlex from "../screens/UpsellFlex";
import { Flex } from "@ledgerhq/native-ui";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useRebornBuyDeviceDrawerController } from "../hooks/useRebornBuyDeviceDrawerController";
import RebornBuyDeviceDrawer from "../drawers/RebornBuyDeviceDrawer";

const Stack = createNativeStackNavigator();

export const MockComponent = () => (
  <Stack.Navigator>
    <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
  </Stack.Navigator>
);

const Setup = () => {
  const { openDrawer } = useRebornBuyDeviceDrawerController();
  return (
    <Flex>
      <Button onPress={() => openDrawer()} />
      <RebornBuyDeviceDrawer />
    </Flex>
  );
};

export const MockDrawerComponent = () => (
  <Stack.Navigator>
    <Stack.Screen name="UpsellFlex" component={Setup} />
  </Stack.Navigator>
);
