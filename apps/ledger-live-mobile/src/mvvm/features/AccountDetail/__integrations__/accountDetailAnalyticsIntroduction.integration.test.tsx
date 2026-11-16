import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { track, trackPage } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
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

const generated = genAccount("account-detail-analytics-introduction", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});
const historical: Account = {
  ...generated,
  blockHeight: 10000,
  operations: generated.operations.map(operation => ({ ...operation, blockHeight: 80 })),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function AnalyticsProbe() {
  const { params } = useRoute();
  const navigation = useNavigation();
  return (
    <>
      <Text testID="analytics-entry-context">{JSON.stringify(params)}</Text>
      <Text onPress={() => navigation.goBack()}>Return to account</Text>
    </>
  );
}

type Setup = Readonly<{ account?: Account; hasDismissed?: boolean; isEligible?: boolean }>;

function renderAccount(
  analyticsBanner: boolean,
  { account = historical, hasDismissed = false, isEligible = true }: Setup = {},
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
        const withFlag = withFlagOverrides({
          accountDetail: { enabled: true, params: { analyticsBanner } },
        })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [account] },
          accountAnalyticsIntroduction: { hasDismissed, isEligible },
        };
      },
    },
  );
}

const pendingOnly: Account = {
  ...historical,
  operations: historical.operations.map(operation => ({ ...operation, blockHeight: null })),
  pendingOperations: historical.operations,
};
const withoutHistory: Account = { ...historical, operations: [], pendingOperations: [] };

const pageAccountCalls = () =>
  jest.mocked(trackPage).mock.calls.filter(([page]) => page.category === "Account");

beforeEach(() => {
  jest.mocked(track).mockClear();
  jest.mocked(trackPage).mockClear();
});

describe("AccountDetail Analytics introduction", () => {
  it("opens Analytics with the account context and keeps the introduction until it is closed", async () => {
    const { user, store } = renderAccount(true);

    await user.press(await screen.findByText("Go to Analytics"));

    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
    expect(screen.getByTestId("analytics-entry-context")).toHaveTextContent(
      JSON.stringify({
        screen: ScreenName.Analytics,
        params: {
          sourceScreenName: ScreenName.AccountDetail,
          accountAnalytics: {
            accountId: historical.id,
            currencyId: "ethereum",
            metric: "balance",
          },
        },
      }),
    );
    await user.press(screen.getByText("Return to account"));
    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeVisible();
  });

  it.each<[string, boolean, Setup]>([
    ["the analyticsBanner param is off", false, {}],
    ["the installation is not eligible", true, { isEligible: false }],
  ])("hides the introduction when %s", async (_, analyticsBanner, setup) => {
    renderAccount(analyticsBanner, setup);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeNull();
  });
});

describe("AccountDetail Analytics introduction tracking", () => {
  it("tracks the CTA once with the network of the account", async () => {
    const { user } = renderAccount(true);

    await user.press(await screen.findByText("Go to Analytics"));

    expect(jest.mocked(track).mock.calls).toEqual([
      ["button_clicked", { network: "ethereum", button: "Analytics banner", page: "Account" }],
    ]);
  });

  it("tracks nothing when the introduction is closed", async () => {
    const { user } = renderAccount(true);

    await user.press(await screen.findByLabelText("Dismiss Analytics introduction"));

    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it("reports the visible introduction on Page Account", async () => {
    renderAccount(true);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeVisible();
    expect(pageAccountCalls()).toEqual([
      [
        expect.objectContaining({ props: expect.objectContaining({ hasAnalyticsBanner: true }) }),
        expect.anything(),
      ],
    ]);
  });

  it.each([
    ["the analyticsBanner param is off", false, {}],
    ["the installation is not eligible", true, { isEligible: false }],
    ["the introduction was dismissed", true, { hasDismissed: true }],
    ["the account has no history", true, { account: withoutHistory }],
    ["the account only has pending operations", true, { account: pendingOnly }],
  ])("reports a hidden introduction on Page Account when %s", async (_, analyticsBanner, setup) => {
    renderAccount(analyticsBanner, setup);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeNull();
    expect(pageAccountCalls()).toEqual([
      [
        expect.objectContaining({ props: expect.objectContaining({ hasAnalyticsBanner: false }) }),
        expect.anything(),
      ],
    ]);
  });
});
