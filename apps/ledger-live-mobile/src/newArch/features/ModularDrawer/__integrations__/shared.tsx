import React, { useCallback } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName, NavigatorName } from "~/const";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";

import { Button } from "@ledgerhq/native-ui";
import {
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
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

export const WITH_ACCOUNT_SELECTION = "Open Drawer (with account selection)";
export const WITHOUT_ACCOUNT_SELECTION = "Open Drawer (without account selection)";

const currencies = [
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
];

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

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

type MockModularDrawerComponentProps = {
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
};

const MockModularDrawerComponent = ({
  networksConfiguration,
  assetsConfiguration,
}: MockModularDrawerComponentProps) => {
  const { openDrawer, closeDrawer, isOpen, enableAccountSelection } = useModularDrawerController();

  const handleOpenDrawer = useCallback(
    (withAccountSelection: boolean) => {
      openDrawer({
        currencies,
        enableAccountSelection: withAccountSelection,
        flow: "integration_test",
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
        onPress={() => handleOpenDrawer(true)}
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
        onPress={() => handleOpenDrawer(false)}
        role="button"
      >
        {WITHOUT_ACCOUNT_SELECTION}
      </Button>
      <ModularDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        currencies={currencies}
        networksConfiguration={networksConfiguration}
        assetsConfiguration={assetsConfiguration}
        enableAccountSelection={enableAccountSelection}
        flow="integration_test"
        source="modular_drawer_shared"
      />
    </>
  );
};

export const ModularDrawerSharedNavigator = (props: MockModularDrawerComponentProps) => (
  <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
    <Stack.Screen
      name={ScreenName.MockedModularDrawer}
      component={() => <MockModularDrawerComponent {...props} />}
    />
    <Stack.Screen
      name={NavigatorName.DeviceSelection}
      component={DeviceSelectionNavigator}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
