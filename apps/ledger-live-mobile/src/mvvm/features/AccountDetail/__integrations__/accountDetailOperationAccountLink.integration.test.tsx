import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import OperationDetails from "~/screens/OperationDetails";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const btcAccount = genAccount("account-detail-operation-link-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 3,
});

const Base = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();
const Accounts = createNativeStackNavigator<AccountsNavigatorParamList>();

function AccountsNavigator() {
  return (
    <Accounts.Navigator screenOptions={{ headerShown: false }}>
      <Accounts.Screen name={ScreenName.Account} component={AccountScreen} />
    </Accounts.Navigator>
  );
}

function HistoryScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  return (
    <>
      <Pressable
        testID="open-account"
        onPress={() => navigation.navigate(ScreenName.Account, { accountId: btcAccount.id })}
      >
        <Text>History screen</Text>
      </Pressable>
      <Pressable
        testID="open-operation-details"
        onPress={() =>
          navigation.navigate(ScreenName.OperationDetails, {
            accountId: btcAccount.id,
            operation: btcAccount.operations[0],
          })
        }
      />
    </>
  );
}

function OperationsHistoryScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.OperationsHistory>) {
  return (
    <Pressable
      testID="history-open-operation-details"
      onPress={() =>
        navigation.navigate(ScreenName.OperationDetails, {
          accountId: btcAccount.id,
          operation: btcAccount.operations[0],
        })
      }
    >
      <Text>Operations history</Text>
    </Pressable>
  );
}

function renderHistory() {
  return render(
    <Base.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Base.Screen name={ScreenName.PortfolioOperationHistory} component={HistoryScreen} />
      <Base.Screen name={ScreenName.Account} component={AccountScreen} />
      <Base.Screen name={NavigatorName.OperationsHistory} component={OperationsHistoryScreen} />
      <Base.Screen name={ScreenName.OperationDetails} component={OperationDetails} />
      <Base.Screen name={NavigatorName.Accounts} component={AccountsNavigator} />
    </Base.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [btcAccount] } };
      },
    },
  );
}

const hidden = { includeHiddenElements: true };

describe("OperationDetails account link", () => {
  it("goes back to the account instead of opening it again when coming from it", async () => {
    const { user } = renderHistory();
    await user.press(screen.getByTestId("open-account"));
    const [firstOperation] = await screen.findAllByTestId("operations-list-item");
    await user.press(firstOperation);

    await user.press(await screen.findByTestId("operationDetails-account"));

    expect(screen.queryByTestId("operation-details-scroll-view", hidden)).toBeNull();
    expect(screen.getAllByTestId(ACCOUNT_DETAIL_TEST_IDS.screen, hidden)).toHaveLength(1);
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
  });

  it("goes back to the account when the operation was opened from its transactions history", async () => {
    const { user } = renderHistory();
    await user.press(screen.getByTestId("open-account"));
    await user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.transactionsHeader));
    await user.press(screen.getByTestId("history-open-operation-details"));

    await user.press(await screen.findByTestId("operationDetails-account"));

    expect(screen.queryByTestId("operation-details-scroll-view", hidden)).toBeNull();
    expect(screen.queryByText("Operations history", hidden)).toBeNull();
    expect(screen.getAllByTestId(ACCOUNT_DETAIL_TEST_IDS.screen, hidden)).toHaveLength(1);
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
  });

  it("opens the account when the operation was opened from elsewhere", async () => {
    const { user } = renderHistory();
    await user.press(screen.getByTestId("open-operation-details"));

    await user.press(await screen.findByTestId("operationDetails-account"));

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.getByTestId("operation-details-scroll-view", hidden)).toBeOnTheScreen();
  });
});
