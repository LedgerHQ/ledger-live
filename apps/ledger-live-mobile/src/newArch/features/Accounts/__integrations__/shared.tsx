import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModularDrawer, useModularDrawerController } from "../../ModularDrawer";
import { useCallback } from "react";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const currencies = [
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
];

const MockComponent = () => {
  const { t } = useTranslation();

  const { openDrawer, closeDrawer, isOpen } = useModularDrawerController();

  const handleOpenDrawer = useCallback(() => {
    openDrawer({
      currencies: currencies.map(c => c.id),
      flow: "integration_test",
      source: "accounts_shared",
    });
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
        iconPosition="left"
        Icon={IconsLegacy.PlusMedium}
        onPress={handleOpenDrawer}
      >
        {t("portfolio.emptyState.buttons.import")}
      </Button>
      <AddAccountDrawer isOpened={isOpen} onClose={handleCloseDrawer} />
      <ModularDrawer
        isOpen={isOpen}
        currencies={currencies.map(c => c.id)}
        onAccountSelected={() => {}}
      />
    </>
  );
};

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export function TestButtonPage() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack.Navigator initialRouteName={ScreenName.MockedAddAssetButton}>
        <Stack.Screen name={ScreenName.MockedAddAssetButton}>
          {() => <MockComponent />}
        </Stack.Screen>
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
