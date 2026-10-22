import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, within, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { OPERATIONS_HISTORY_TEST_IDS } from "LLM/features/OperationsHistory/testIds";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const ethRoot = genAccount("account-detail-transactions-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethRoot, usdcToken);
const ethAccount: Account = { ...ethRoot, subAccounts: [usdcAccount] };
const emptyBtcAccount = genAccount("account-detail-transactions-empty", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function OperationsHistoryStub({ route }: { route: { params?: unknown } }) {
  return <Text testID="operations-history-params">{JSON.stringify(route.params)}</Text>;
}

function renderAccount(account: Account) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
      <Stack.Screen name={NavigatorName.OperationsHistory} component={OperationsHistoryStub} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [ethAccount, emptyBtcAccount] },
        };
      },
    },
  );
}

describe("AccountDetail transactions", () => {
  it("lists the 3 latest operations of the account and its tokens", async () => {
    renderAccount(ethAccount);

    const section = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.transactions);
    expect(within(section).getByText("Transactions")).toBeVisible();
    expect(within(section).getAllByTestId(OPERATIONS_HISTORY_TEST_IDS.listItem)).toHaveLength(3);
  });

  it("opens the history scoped to the account and its tokens from the header", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.transactionsHeader));

    expect(screen.getByTestId("operations-history-params")).toHaveTextContent(
      JSON.stringify({
        screen: ScreenName.OperationsList,
        params: { accountIds: [ethAccount.id, usdcAccount.id] },
      }),
    );
  });

  it("hides the section when the account has no operations", () => {
    renderAccount(emptyBtcAccount);

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.transactions)).toBeNull();
  });
});
