import React, { useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName, NavigatorName } from "~/const";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import AddAccountsNavigator from "LLM/features/Accounts/Navigator";

import { Button } from "@ledgerhq/native-ui";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_2,
  ARB_ACCOUNT,
  SCROLL_ACCOUNT,
  BASE_ACCOUNT,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/accounts.mock";
import { BigNumber } from "bignumber.js";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { ModularDrawer, useModularDrawerController } from "..";
import ReceiveFundsNavigator from "~/components/RootNavigator/ReceiveFundsNavigator";

export const WITH_ACCOUNT_SELECTION = "Open Drawer (with account selection)";
export const WITHOUT_ACCOUNT_SELECTION = "Open Drawer (without account selection)";

export { ETH_ACCOUNT, ETH_ACCOUNT_2, BTC_ACCOUNT, ARB_ACCOUNT, BASE_ACCOUNT };

export const mockedAccounts = [
  ETH_ACCOUNT,
  ETH_ACCOUNT_2,
  BTC_ACCOUNT,
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  { ...SCROLL_ACCOUNT, balance: new BigNumber(34455).multipliedBy(10 ** 18) },
];

export const mockedFF = {
  llmModularDrawer: {
    enabled: true,
    params: {
      enableModularization: true,
    },
  },
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

type MockModularDrawerComponentProps = {
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  flow?: string;
};

const MockModularDrawerComponent = ({
  networksConfiguration,
  assetsConfiguration,
  flow = "integration_test",
}: MockModularDrawerComponentProps) => {
  const { openDrawer, closeDrawer, isOpen } = useModularDrawerController();

  const handleOpenDrawer = useCallback(
    (withAccountSelection: boolean, flow: string) => {
      openDrawer({
        enableAccountSelection: withAccountSelection,
        flow,
        source: "modular_drawer_shared",
      });
    },
    [openDrawer],
  );

  return (
    <>
      <Button
        type="shade"
        size="large"
        outline
        mt={6}
        mb={8}
        onPress={() => handleOpenDrawer(true, flow)}
        role="button"
      >
        {WITH_ACCOUNT_SELECTION}
      </Button>
      <Button
        type="shade"
        size="large"
        outline
        mt={6}
        mb={8}
        onPress={() => handleOpenDrawer(false, flow)}
        role="button"
      >
        {WITHOUT_ACCOUNT_SELECTION}
      </Button>
      <ModularDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        networksConfiguration={networksConfiguration}
        assetsConfiguration={assetsConfiguration}
        onAccountSelected={() => {}}
      />
    </>
  );
};

export const ModularDrawerSharedNavigator = (props: MockModularDrawerComponentProps) => (
  <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
    <Stack.Screen name={ScreenName.MockedModularDrawer}>
      {() => <MockModularDrawerComponent {...props} />}
    </Stack.Screen>
    <Stack.Screen
      name={NavigatorName.DeviceSelection}
      component={DeviceSelectionNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={NavigatorName.AddAccounts}
      component={AddAccountsNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={NavigatorName.ReceiveFunds}
      component={ReceiveFundsNavigator}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
