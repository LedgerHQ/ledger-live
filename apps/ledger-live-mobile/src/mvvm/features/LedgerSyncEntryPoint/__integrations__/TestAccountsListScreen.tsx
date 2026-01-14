import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountsList from "../../Accounts/screens/AccountsList";
import { AccountsListNavigator } from "../../Accounts/screens/AccountsList/types";
import { ScreenName } from "~/const";
import { EntryPoint } from "../types";
import LedgerSyncEntryPoint from "..";

const Stack = createNativeStackNavigator<AccountsListNavigator>();

type TestAccountsListScreenProps = {
  entryPoint: EntryPoint;
  page: string;
};

export const TestAccountsListScreen = ({ entryPoint, page }: TestAccountsListScreenProps) => (
  <Stack.Navigator>
    <Stack.Screen
      name={ScreenName.AccountsList}
      component={AccountsList}
      initialParams={{ sourceScreenName: ScreenName.AccountsList, canAddAccount: true }}
      options={{
        headerTitle: "",
        headerRight: () => <LedgerSyncEntryPoint entryPoint={entryPoint} page={page} />,
      }}
    />
  </Stack.Navigator>
);
