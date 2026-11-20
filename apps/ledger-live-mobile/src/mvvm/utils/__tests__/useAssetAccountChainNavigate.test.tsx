import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { useAssetAccountChainNavigate } from "../assetAccountChain";

const Root = createNativeStackNavigator<RootStackParamList>();
const Base = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();
const AssetStack = createNativeStackNavigator<AssetDetailNavigatorParamsList>();
const AccountsStack = createNativeStackNavigator<AccountsNavigatorParamList>();

function EntryScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  const openAsset = (currencyId: string) =>
    navigation.navigate(NavigatorName.AssetDetail, {
      screen: ScreenName.AssetDetail,
      params: { currencyId },
    });
  return (
    <>
      <Text>entry</Text>
      <Pressable testID="open-asset" onPress={() => openAsset("1")} />
      <Pressable testID="open-asset-A" onPress={() => openAsset("A")} />
    </>
  );
}

/** Asset page: `hop` opens the next numbered account, the other buttons open named accounts. */
function AssetScreen({
  route,
  navigation,
}: StackNavigatorProps<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>) {
  const navigateInChain = useAssetAccountChainNavigate();
  const page = route.params.currencyId;
  const openAccount = (accountId: string, parentId?: string) =>
    navigateInChain(NavigatorName.Accounts, {
      screen: ScreenName.Account,
      params: { accountId, parentId },
    });
  return (
    <>
      <Text>{`page ${page}`}</Text>
      <Pressable testID={`hop-${page}`} onPress={() => openAccount(String(Number(page) + 1))} />
      <Pressable testID={`${page}-to-account-X`} onPress={() => openAccount("X")} />
      <Pressable testID={`${page}-to-token-of-X`} onPress={() => openAccount("token-X", "X")} />
      <Pressable testID={`back-${page}`} onPress={() => navigation.goBack()} />
    </>
  );
}

/** Account page, labelled like the app with the main account of a token account. */
function AccountScreen({
  route,
  navigation,
}: StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Account>) {
  const navigateInChain = useAssetAccountChainNavigate();
  const page = route.params?.parentId ?? route.params?.accountId ?? "";
  const openAsset = (currencyId: string) =>
    navigateInChain(NavigatorName.AssetDetail, {
      screen: ScreenName.AssetDetail,
      params: { currencyId },
    });
  return (
    <>
      <Text>{`page ${page}`}</Text>
      <Pressable testID={`hop-${page}`} onPress={() => openAsset(String(Number(page) + 1))} />
      <Pressable testID={`${page}-to-asset-A`} onPress={() => openAsset("A")} />
      <Pressable testID={`${page}-to-asset-B`} onPress={() => openAsset("B")} />
      <Pressable testID={`back-${page}`} onPress={() => navigation.goBack()} />
    </>
  );
}

const AssetNavigator = () => (
  <AssetStack.Navigator screenOptions={{ headerShown: false }}>
    <AssetStack.Screen name={ScreenName.AssetDetail} component={AssetScreen} />
  </AssetStack.Navigator>
);

const AccountsNavigator = () => (
  <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
    <AccountsStack.Screen name={ScreenName.Account} component={AccountScreen} />
  </AccountsStack.Navigator>
);

const BaseNavigator = () => (
  <Base.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
    <Base.Screen name={ScreenName.PortfolioOperationHistory} component={EntryScreen} />
    <Base.Screen name={NavigatorName.AssetDetail} component={AssetNavigator} />
    <Base.Screen name={NavigatorName.Accounts} component={AccountsNavigator} />
  </Base.Navigator>
);

/** Same hierarchy as the app: the detail pages live in the Base stack, under the Root one. */
function renderChain() {
  return render(
    <Root.Navigator screenOptions={{ headerShown: false }}>
      <Root.Screen name={NavigatorName.Base} component={BaseNavigator} />
    </Root.Navigator>,
  );
}

describe("useAssetAccountChainNavigate", () => {
  it("returns to the entry point after two backs however many hops were made", async () => {
    const { user } = renderChain();
    await user.press(screen.getByTestId("open-asset"));
    for (let page = 1; page <= 5; page++) {
      await user.press(await screen.findByTestId(`hop-${page}`));
    }
    expect(await screen.findByText("page 6")).toBeVisible();

    await user.press(screen.getByTestId("back-6"));
    expect(await screen.findByText("page 2")).toBeVisible();

    await user.press(screen.getByTestId("back-2"));
    expect(await screen.findByText("page 1")).toBeVisible();

    await user.press(screen.getByTestId("back-1"));
    expect(await screen.findByText("entry")).toBeVisible();
  });

  it("goes back to the page right below instead of showing it twice", async () => {
    const { user } = renderChain();
    await user.press(screen.getByTestId("open-asset-A"));
    await user.press(await screen.findByTestId("A-to-account-X"));
    await user.press(await screen.findByTestId("X-to-asset-B"));
    await user.press(await screen.findByTestId("B-to-account-X"));
    expect(await screen.findByText("page X")).toBeVisible();

    await user.press(screen.getByTestId("back-X"));
    expect(await screen.findByText("page A")).toBeVisible();

    await user.press(screen.getByTestId("back-A"));
    expect(await screen.findByText("entry")).toBeVisible();
  });

  it("treats a token account as its parent account page", async () => {
    const { user } = renderChain();
    await user.press(screen.getByTestId("open-asset-A"));
    await user.press(await screen.findByTestId("A-to-account-X"));
    await user.press(await screen.findByTestId("X-to-asset-B"));
    await user.press(await screen.findByTestId("B-to-token-of-X"));
    expect(await screen.findByText("page X")).toBeVisible();

    await user.press(screen.getByTestId("back-X"));
    expect(await screen.findByText("page A")).toBeVisible();
  });

  it("keeps every page while the chain is short", async () => {
    const { user } = renderChain();
    await user.press(screen.getByTestId("open-asset"));
    await user.press(await screen.findByTestId("hop-1"));

    await user.press(await screen.findByTestId("back-2"));
    expect(await screen.findByText("page 1")).toBeVisible();
  });
});
