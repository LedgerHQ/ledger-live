import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import Accounts from "~/screens/Accounts";
import Account from "~/screens/Account";
import NftCollection from "~/screens/Nft/NftCollection";
import NftGallery from "~/screens/Nft/NftGallery";
import NftViewer from "../Nft/NftViewer";
import NftCollectionHeaderTitle from "~/screens/Nft/NftCollection/NftCollectionHeaderTitle";
import NftGalleryHeaderTitle from "~/screens/Nft/NftGallery/NftGalleryHeaderTitle";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ReadOnlyAccounts from "~/screens/Accounts/ReadOnly/ReadOnlyAccounts";
import ReadOnlyAssets from "~/screens/Portfolio/ReadOnlyAssets";

import Asset from "~/screens/WalletCentricAsset";
import ReadOnlyAsset from "~/screens/WalletCentricAsset/ReadOnly";
import Assets from "~/screens/Assets";

import ReadOnlyAccount from "~/screens/Account/ReadOnly/ReadOnlyAccount";

import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "~/reducers/accounts";

const Stack = createStackNavigator<AccountsNavigatorParamList>();

export default function AccountsNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && hasNoAccounts;

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
        options={{ headerShown: false }}
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
      <Stack.Screen
        name={ScreenName.Assets}
        component={readOnlyModeEnabled ? ReadOnlyAssets : Assets}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Asset}
        component={readOnlyModeEnabled ? ReadOnlyAsset : Asset}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
