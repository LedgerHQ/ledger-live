import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "~/const";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import AddAccountsNavigator from "~/components/RootNavigator/AddAccountsNavigator";
import ImportAccountsNavigator from "~/components/RootNavigator/ImportAccountsNavigator";

const MockComponent = () => {
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = React.useState<boolean>(false);

  const openAddModal = () => setAddModalOpened(true);
  const closeAddModal = () => setAddModalOpened(false);
  const reopenAddModal = () => setAddModalOpened(true);

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
        reopenDrawer={reopenAddModal}
      />
    </>
  );
};

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export function TestButtonPage() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.MockedAddAssetButton}>
      <Stack.Screen name={ScreenName.MockedAddAssetButton} component={MockComponent} />
      <Stack.Screen name={NavigatorName.AddAccounts} component={AddAccountsNavigator} />
      <Stack.Screen name={NavigatorName.ImportAccounts} component={ImportAccountsNavigator} />
    </Stack.Navigator>
  );
}
