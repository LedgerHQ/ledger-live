import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { ScreenName } from "../../const";
import Accounts from "../../screens/Accounts";
import Account from "../../screens/Account";
import NftCollection from "../../screens/Nft/NftCollection";
import NftGallery from "../../screens/Nft/NftGallery";
import NftViewer from "../Nft/NftViewer";
import NftCollectionHeaderTitle from "../../screens/Nft/NftCollection/NftCollectionHeaderTitle";
import NftGalleryHeaderTitle from "../../screens/Nft/NftGallery/NftGalleryHeaderTitle";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import AccountHeaderRight from "../../screens/Account/AccountHeaderRight";
import AccountHeaderTitle from "../../screens/Account/AccountHeaderTitle";
import ReadOnlyAccounts from "../../screens/Accounts/ReadOnly/ReadOnlyAccounts";

import ReadOnlyAccountHeaderRight from "../../screens/Account/ReadOnly/ReadOnlyAccountHeaderRight";
import ReadOnlyAccountHeaderTitle from "../../screens/Account/ReadOnly/ReadOnlyAccountHeaderTitle";
import ReadOnlyAccount from "../../screens/Account/ReadOnly/ReadOnlyAccount";
import { accountsSelector } from "../../reducers/accounts";

export default function AccountsNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [
    colors,
  ]);

  const accounts = useSelector(accountsSelector);
  const readOnlyModeEnabled =
    useSelector(readOnlyModeEnabledSelector) && accounts.length <= 0;

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.Accounts}
        component={readOnlyModeEnabled ? ReadOnlyAccounts : Accounts}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Account}
        component={readOnlyModeEnabled ? ReadOnlyAccount : Account}
        options={{
          headerTitle: () =>
            readOnlyModeEnabled ? (
              <ReadOnlyAccountHeaderTitle />
            ) : (
              <AccountHeaderTitle />
            ),
          headerRight: () =>
            readOnlyModeEnabled ? (
              <ReadOnlyAccountHeaderRight />
            ) : (
              <AccountHeaderRight />
            ),
        }}
      />
      <Stack.Screen
        name={ScreenName.NftCollection}
        component={NftCollection}
        options={{
          headerTitle: () => <NftCollectionHeaderTitle />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NftGallery}
        component={NftGallery}
        options={{
          headerTitle: () => <NftGalleryHeaderTitle />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={NftViewer}
        options={{
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
