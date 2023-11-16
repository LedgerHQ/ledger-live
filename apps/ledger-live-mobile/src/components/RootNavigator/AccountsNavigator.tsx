import React, { useMemo, lazy } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "../../reducers/accounts";
import { withSuspense } from "~/helpers/withSuspense";


const Accounts = lazy(() => import("../../screens/Accounts"));
const Account = lazy(() => import("../../screens/Account"));
const NftCollection = lazy(() => import("../../screens/Nft/NftCollection"));
const NftGallery = lazy(() => import("../../screens/Nft/NftGallery"));
const NftViewer = lazy(() => import("../Nft/NftViewer"));
const NftCollectionHeaderTitle = lazy(() => import("../../screens/Nft/NftCollection/NftCollectionHeaderTitle"));
const NftGalleryHeaderTitle = lazy(() => import("../../screens/Nft/NftGallery/NftGalleryHeaderTitle"));
const ReadOnlyAccounts = lazy(() => import("../../screens/Accounts/ReadOnly/ReadOnlyAccounts"));
const ReadOnlyAssets = lazy(() => import("../../screens/Portfolio/ReadOnlyAssets"));
const Asset = lazy(() => import("../../screens/WalletCentricAsset"));
const ReadOnlyAsset = lazy(() => import("../../screens/WalletCentricAsset/ReadOnly"));
const Assets = lazy(() => import("../../screens/Assets"));
const ReadOnlyAccount = lazy(() => import("../../screens/Account/ReadOnly/ReadOnlyAccount"));


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
        component={withSuspense(readOnlyModeEnabled ? ReadOnlyAccounts : Accounts)}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Account}
        component={withSuspense(readOnlyModeEnabled ? ReadOnlyAccount : Account)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.NftCollection}
        component={withSuspense(NftCollection)}
        options={{
          headerTitle: () => <NftCollectionHeaderTitle />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NftGallery}
        component={withSuspense(NftGallery)}
        options={{
          headerTitle: () => <NftGalleryHeaderTitle />,
        }}
      />
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={withSuspense(NftViewer)}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.Assets}
        component={withSuspense(readOnlyModeEnabled ? ReadOnlyAssets : Assets)}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Asset}
        component={withSuspense(readOnlyModeEnabled ? ReadOnlyAsset : Asset)}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
