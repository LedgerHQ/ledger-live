// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import Accounts from "../../screens/Accounts";
import AccountOrder from "../../screens/Accounts/AccountOrder";
import AddAccount from "../../screens/Accounts/AddAccount";
import Account from "../../screens/Account";
import { stackNavigatorConfig } from "../../navigation/navigatorConfig";
import AccountHeaderRight from "../../screens/Account/AccountHeaderRight";
import AccountHeaderTitle from "../../screens/Account/AccountHeaderTitle";

export default function AccountsNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.Accounts}
        component={Accounts}
        options={{
          title: t("accounts.title"),
          headerLeft: () => <AccountOrder />,
          headerRight: () => <AddAccount />,
        }}
      />
      <Stack.Screen
        name={ScreenName.Account}
        component={Account}
        options={{
          headerTitle: () => <AccountHeaderTitle />,
          headerRight: () => <AccountHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
