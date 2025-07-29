import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "~/const";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import AssetSelectionNavigator from "LLM/features/AssetSelection/Navigator";
import ImportAccountsNavigator from "~/components/RootNavigator/ImportAccountsNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModularDrawer, useModularDrawerController } from "../../ModularDrawer";

const MockComponent = () => {
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = React.useState<boolean>(false);

  const openAddModal = () => setAddModalOpened(true);
  const closeAddModal = () => setAddModalOpened(false);

  const { isOpen, preselectedCurrencies } = useModularDrawerController();

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
        onPress={openAddModal}
      >
        {t("portfolio.emptyState.buttons.import")}
      </Button>
      <AddAccountDrawer isOpened={isAddModalOpened} onClose={closeAddModal} />
      <ModularDrawer
        isOpen={isOpen}
        currencies={preselectedCurrencies}
        flow="integration_test"
        source="accounts_shared"
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
        <Stack.Screen name={NavigatorName.AssetSelection} component={AssetSelectionNavigator} />
        <Stack.Screen name={NavigatorName.ImportAccounts} component={ImportAccountsNavigator} />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
