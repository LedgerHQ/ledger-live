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
import { ModularDrawer } from "../../ModularDrawer";
import {
  mockEthCryptoCurrency,
  mockBtcCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

type Props = {
  shouldShowModularDrawer?: boolean;
};

const MockComponent = ({ shouldShowModularDrawer }: Props) => {
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = React.useState<boolean>(false);

  const openAddModal = () => setAddModalOpened(true);
  const closeAddModal = () => setAddModalOpened(false);

  const [isModularDrawerVisible, setModularDrawerVisible] = React.useState<boolean>(false);

  const handleOpenModularDrawer = () => setModularDrawerVisible(true);

  const onShowModularDrawer = React.useCallback(() => {
    closeAddModal();
    handleOpenModularDrawer();
  }, []);

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
      <AddAccountDrawer
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
        onShowModularDrawer={shouldShowModularDrawer ? onShowModularDrawer : undefined}
      />
      <ModularDrawer
        isOpen={isModularDrawerVisible}
        currencies={[mockEthCryptoCurrency, mockBtcCryptoCurrency]}
      />
    </>
  );
};

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export function TestButtonPage(props: Props) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack.Navigator initialRouteName={ScreenName.MockedAddAssetButton}>
        <Stack.Screen name={ScreenName.MockedAddAssetButton}>
          {() => <MockComponent shouldShowModularDrawer={props.shouldShowModularDrawer} />}
        </Stack.Screen>
        <Stack.Screen name={NavigatorName.AssetSelection} component={AssetSelectionNavigator} />
        <Stack.Screen name={NavigatorName.ImportAccounts} component={ImportAccountsNavigator} />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
