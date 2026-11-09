import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
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

type IntroductionSetup = Readonly<{
  hasDismissed?: boolean;
  analyticsBanner?: boolean;
}>;

function renderAccount({ hasDismissed = false, analyticsBanner = true }: IntroductionSetup = {}) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: historical.id }}
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
          accounts: { ...withFlag.accounts, active: [historical] },
          accountAnalyticsIntroduction: { hasDismissed },
        };
      },
    },
  );
}

describe("AccountDetail Analytics introduction", () => {
  it("shows the introduction when the analyticsBanner param is on", async () => {
    renderAccount();

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeVisible();
    expect(screen.getByText("Looking for your account performance?")).toBeVisible();
  });

  it("opens Analytics with the account context and keeps the introduction until it is closed", async () => {
    const { user, store } = renderAccount();

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

  it.each<IntroductionSetup>([{ analyticsBanner: false }, { hasDismissed: true }])(
    "hides the introduction with %o",
    async setup => {
      renderAccount(setup);

      expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
      expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction)).toBeNull();
    },
  );
});
