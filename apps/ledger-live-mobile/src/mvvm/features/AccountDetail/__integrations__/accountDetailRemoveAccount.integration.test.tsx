import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { MainNavigatorParamList } from "~/components/RootNavigator/types/MainNavigator";
import type { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import OperationDetails from "~/screens/OperationDetails";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const btcAccount = genAccount("account-detail-remove-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 3,
});
const ethAccount = genAccount("account-detail-remove-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});

const Base = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();
const Main = createNativeStackNavigator<MainNavigatorParamList>();
const Portfolio = createNativeStackNavigator<PortfolioNavigatorStackParamList>();
const PortfolioAccounts = createNativeStackNavigator<AccountsNavigatorParamList>();

function withAccounts(accounts: Account[]) {
  return (state: State): State => {
    const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
    return { ...withFlag, accounts: { ...withFlag.accounts, active: accounts } };
  };
}

function PreviousScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  return (
    <Pressable
      testID="open-account"
      onPress={() => navigation.navigate(ScreenName.Account, { accountId: btcAccount.id })}
    >
      <Text>Previous screen</Text>
    </Pressable>
  );
}

function OperationOriginScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  return (
    <Pressable
      testID="open-operation-details"
      onPress={() =>
        navigation.navigate(ScreenName.OperationDetails, {
          accountId: btcAccount.id,
          operation: btcAccount.operations[0],
        })
      }
    >
      <Text>Operation origin</Text>
    </Pressable>
  );
}

function renderFromPreviousScreen(accounts: Account[]) {
  return render(
    <Base.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Base.Screen name={ScreenName.PortfolioOperationHistory} component={PreviousScreen} />
      <Base.Screen name={ScreenName.Account} component={AccountScreen} />
    </Base.Navigator>,
    { overrideInitialState: withAccounts(accounts) },
  );
}

function PortfolioScreen({
  navigation,
}: StackNavigatorProps<PortfolioNavigatorStackParamList, ScreenName.Portfolio>) {
  return (
    <Pressable
      testID="open-accounts"
      onPress={() =>
        navigation.navigate(NavigatorName.PortfolioAccounts, {
          screen: ScreenName.Accounts,
          params: {},
        })
      }
    >
      <Text>Portfolio screen</Text>
    </Pressable>
  );
}

function AccountsListScreen({
  navigation,
}: StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Accounts>) {
  return (
    <Pressable
      testID="open-account"
      onPress={() => navigation.navigate(ScreenName.Account, { accountId: btcAccount.id })}
    >
      <Text>Accounts list</Text>
    </Pressable>
  );
}

function PortfolioAccountsNavigator() {
  return (
    <PortfolioAccounts.Navigator screenOptions={{ headerShown: false }}>
      <PortfolioAccounts.Screen name={ScreenName.Accounts} component={AccountsListScreen} />
      <PortfolioAccounts.Screen name={ScreenName.Account} component={AccountScreen} />
    </PortfolioAccounts.Navigator>
  );
}

function PortfolioNavigator() {
  return (
    <Portfolio.Navigator screenOptions={{ headerShown: false }}>
      <Portfolio.Screen name={ScreenName.Portfolio} component={PortfolioScreen} />
      <Portfolio.Screen
        name={NavigatorName.PortfolioAccounts}
        component={PortfolioAccountsNavigator}
      />
    </Portfolio.Navigator>
  );
}

function MainNavigator() {
  return (
    <Main.Navigator screenOptions={{ headerShown: false }}>
      <Main.Screen name={NavigatorName.Portfolio} component={PortfolioNavigator} />
    </Main.Navigator>
  );
}

function renderFromAccountsList(accounts: Account[]) {
  return render(
    <Base.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Base.Screen name={NavigatorName.Main} component={MainNavigator} />
      <Base.Screen name={NavigatorName.OperationsHistory} component={HistoryScreen} />
      <Base.Screen name={ScreenName.OperationDetails} component={OperationDetails} />
      <Base.Screen name={NavigatorName.Accounts} component={AccountsNavigator} />
    </Base.Navigator>,
    { overrideInitialState: withAccounts(accounts) },
  );
}

function HistoryScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.OperationsHistory>) {
  return (
    <Pressable
      testID="open-operation-details"
      onPress={() =>
        navigation.navigate(ScreenName.OperationDetails, {
          accountId: btcAccount.id,
          operation: btcAccount.operations[0],
        })
      }
    >
      <Text>History screen</Text>
    </Pressable>
  );
}

const Accounts = createNativeStackNavigator<AccountsNavigatorParamList>();

function AccountsNavigator() {
  return (
    <Accounts.Navigator screenOptions={{ headerShown: false }}>
      <Accounts.Screen name={ScreenName.Account} component={AccountScreen} />
    </Accounts.Navigator>
  );
}

function renderWithOperationDetails(accounts: Account[]) {
  return render(
    <Base.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Base.Screen name={ScreenName.PortfolioOperationHistory} component={OperationOriginScreen} />
      <Base.Screen name={ScreenName.OperationDetails} component={OperationDetails} />
      <Base.Screen name={NavigatorName.Accounts} component={AccountsNavigator} />
    </Base.Navigator>,
    { overrideInitialState: withAccounts(accounts) },
  );
}

async function openRemoveConfirmation(user: ReturnType<typeof render>["user"]) {
  await user.press(screen.getByTestId("open-account"));
  await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
  await user.press(screen.getByText("Remove account from portfolio"));
}

const activeAccountIds = (state: State) => state.accounts.active.map(account => account.id);

describe("AccountDetail remove account", () => {
  it("removes the account and goes back to the previous screen", async () => {
    const { user, store } = renderFromPreviousScreen([btcAccount, ethAccount]);
    await openRemoveConfirmation(user);

    await user.press(screen.getByText("Yes, remove."));

    expect(activeAccountIds(store.getState())).toEqual([ethAccount.id]);
    expect(screen.getByText("Previous screen")).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeNull();
  });

  it("goes back to the accounts list when opened from the portfolio accounts", async () => {
    const { user, store } = renderFromAccountsList([btcAccount, ethAccount]);
    await user.press(screen.getByTestId("open-accounts"));
    await openRemoveConfirmation(user);

    await user.press(screen.getByText("Yes, remove."));

    expect(activeAccountIds(store.getState())).toEqual([ethAccount.id]);
    expect(screen.getByText("Accounts list")).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeNull();
  });

  it("keeps the account when the removal is cancelled", async () => {
    const { user, store } = renderFromPreviousScreen([btcAccount, ethAccount]);
    await openRemoveConfirmation(user);

    await user.press(screen.getByText("Keep"));

    expect(activeAccountIds(store.getState())).toEqual([btcAccount.id, ethAccount.id]);
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
  });

  it("leaves every screen about the removed account, including the operation it was opened from", async () => {
    const { user, store } = renderWithOperationDetails([btcAccount, ethAccount]);
    await user.press(screen.getByTestId("open-operation-details"));
    await user.press(await screen.findByTestId("operationDetails-account"));
    await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
    await user.press(screen.getByText("Remove account from portfolio"));

    await user.press(screen.getByText("Yes, remove."));

    expect(activeAccountIds(store.getState())).toEqual([ethAccount.id]);
    expect(screen.getByText("Operation origin")).toBeVisible();
    expect(
      screen.queryByTestId("operation-details-scroll-view", { includeHiddenElements: true }),
    ).toBeNull();
    expect(
      screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen, { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("returns to the nested accounts list after going back to the account from its history", async () => {
    const { user, store } = renderFromAccountsList([btcAccount, ethAccount]);
    await user.press(screen.getByTestId("open-accounts"));
    await user.press(screen.getByTestId("open-account"));
    await user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.transactionsHeader));
    await user.press(screen.getByTestId("open-operation-details"));
    await user.press(await screen.findByTestId("operationDetails-account"));
    await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
    await user.press(screen.getByText("Remove account from portfolio"));

    await user.press(screen.getByText("Yes, remove."));

    const hidden = { includeHiddenElements: true };
    expect(activeAccountIds(store.getState())).toEqual([ethAccount.id]);
    expect(screen.getByText("Accounts list")).toBeVisible();
    expect(screen.queryByText("History screen", hidden)).toBeNull();
    expect(screen.queryByTestId("operation-details-scroll-view", hidden)).toBeNull();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen, hidden)).toBeNull();
  });
});
