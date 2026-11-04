import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

jest.mock("~/screens/Account", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: () => <Text testID="legacy-account-screen">Legacy account</Text>,
  };
});

const CARD = ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction;
const hidden = { includeHiddenElements: true };

const baseEth = genAccount("account-detail-analytics-introduction-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});

const withBlockHeight = (operations: Operation[], blockHeight: number | null): Operation[] =>
  operations.map(operation => ({ ...operation, blockHeight }));

const confirmedHeight = baseEth.blockHeight - 10_000;

const ethWithConfirmedHistory: Account = {
  ...baseEth,
  operations: withBlockHeight(baseEth.operations, confirmedHeight),
};

const ethWithPendingHistoryOnly: Account = {
  ...baseEth,
  operations: withBlockHeight(baseEth.operations, null),
};

const ethWithoutHistory: Account = { ...baseEth, operations: [], operationsCount: 0 };

const usdcWithConfirmedHistory: TokenAccount = (() => {
  const token = genTokenAccount(0, ethWithoutHistory, usdcToken);
  return { ...token, operations: withBlockHeight(token.operations, confirmedHeight) };
})();

const ethWithTokenHistoryOnly: Account = {
  ...ethWithoutHistory,
  subAccounts: [usdcWithConfirmedHistory],
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function AnalyticsProbe({
  route,
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.Analytics>) {
  return (
    <Pressable testID="analytics-probe-back" onPress={() => navigation.goBack()}>
      <Text testID="analytics-probe-params">{JSON.stringify(route.params)}</Text>
    </Pressable>
  );
}

type RenderOptions = Readonly<{ accountDetailEnabled?: boolean; hasDismissed?: boolean }>;

function renderAccount(
  account: Account,
  { accountDetailEnabled = true, hasDismissed = false }: RenderOptions = {},
) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
      <Stack.Screen name={NavigatorName.Analytics} component={AnalyticsProbe} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: accountDetailEnabled } })(
          state,
        );
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [account] },
          accountAnalyticsIntroduction: { hasDismissed },
        };
      },
    },
  );
}

describe("AccountDetail Analytics introduction", () => {
  it("shows the introduction after the hero for an account with confirmed history", async () => {
    renderAccount(ethWithConfirmedHistory);

    expect(await screen.findByTestId(CARD)).toBeVisible();
    expect(screen.getByText("Looking for your account performance?")).toBeVisible();
    expect(
      screen.getByText("All your performance data now lives on the Analytics page."),
    ).toBeVisible();

    const order = screen
      .getAllByTestId(new RegExp(`^(${ACCOUNT_DETAIL_TEST_IDS.hero}|${CARD})$`))
      .map(node => node.props.testID);
    expect(order).toEqual([ACCOUNT_DETAIL_TEST_IDS.hero, CARD]);
  });

  it("shows the introduction when only a token has confirmed history", async () => {
    renderAccount(ethWithTokenHistoryOnly);

    expect(await screen.findByTestId(CARD)).toBeVisible();
  });

  it.each([
    ["only pending operations", ethWithPendingHistoryOnly],
    ["no operations", ethWithoutHistory],
  ])("does not show the introduction for an account with %s", async (_, account) => {
    renderAccount(account);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.queryByTestId(CARD)).toBeNull();
  });

  it("does not show the introduction once it has been dismissed on this installation", async () => {
    renderAccount(ethWithConfirmedHistory, { hasDismissed: true });

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.queryByTestId(CARD)).toBeNull();
  });

  it("keeps the legacy account page when Account Detail is disabled", async () => {
    renderAccount(ethWithConfirmedHistory, { accountDetailEnabled: false });

    expect(await screen.findByTestId("legacy-account-screen")).toBeVisible();
    expect(screen.queryByTestId(CARD)).toBeNull();
  });

  it("dismisses the introduction for every account when it is closed", async () => {
    const { store, user } = renderAccount(ethWithConfirmedHistory);

    await user.press(await screen.findByLabelText("Dismiss Analytics introduction"));

    expect(screen.queryByTestId(CARD)).toBeNull();
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
  });

  it("opens Balance scoped to the native asset and account, then returns without the introduction", async () => {
    const { store, user } = renderAccount(ethWithTokenHistoryOnly);

    await user.press(await screen.findByText("Go to Analytics"));

    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
    expect(JSON.parse(screen.getByTestId("analytics-probe-params").props.children)).toEqual({
      screen: ScreenName.Analytics,
      params: {
        sourceScreenName: ScreenName.AccountDetail,
        accountAnalytics: {
          accountId: ethWithTokenHistoryOnly.id,
          currencyId: "ethereum",
          metric: "balance",
        },
      },
    });

    await user.press(screen.getByTestId("analytics-probe-back"));

    expect(screen.queryByTestId("analytics-probe-params", hidden)).toBeNull();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.queryByTestId(CARD)).toBeNull();
  });
});
