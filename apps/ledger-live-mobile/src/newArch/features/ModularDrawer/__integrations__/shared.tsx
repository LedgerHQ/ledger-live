import React, { useCallback } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName, NavigatorName } from "~/const";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import { ModularDrawer } from "../ModularDrawer";
import { Button } from "@ledgerhq/native-ui";
import {
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useModularDrawer } from "../hooks/useModularDrawer";
import { ModularDrawerStep } from "../types";

const currencies = [
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
];

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

const MockModularDrawerComponent = () => {
  const { openDrawer, closeDrawer, isDrawerOpen } = useModularDrawer();

  const handleOpenDrawer = useCallback(() => {
    openDrawer();
  }, [openDrawer]);

  const handleCloseDrawer = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  return (
    <>
      <Button
        type="shade"
        size="large"
        outline
        mt={6}
        mb={8}
        onPress={handleOpenDrawer}
        role="button"
      >
        {"Open Drawer"}
      </Button>
      <ModularDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        currencies={currencies}
        selectedStep={ModularDrawerStep.Asset}
        flow="integration_test"
        source="modular_drawer_shared"
      />
    </>
  );
};

export const ModularDrawerSharedNavigator = () => (
  <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
    <Stack.Screen name={ScreenName.MockedModularDrawer} component={MockModularDrawerComponent} />
    <Stack.Screen
      name={NavigatorName.DeviceSelection}
      component={DeviceSelectionNavigator}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
