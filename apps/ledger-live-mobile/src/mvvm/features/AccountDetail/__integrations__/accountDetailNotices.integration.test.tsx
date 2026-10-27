import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
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

const accountOf = (currencyId: string): Account =>
  genAccount(`account-detail-notices-${currencyId}`, {
    currency: getCryptoCurrencyById(currencyId),
    operationsSize: 2,
    subAccountsCount: 0,
  });

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount(account: Account, flags: Record<string, { enabled: boolean }> = {}) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true }, ...flags })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

const notice = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.notices}-${id}`;

describe("AccountDetail notices", () => {
  it("shows the Robinhood disclaimer on a Robinhood chain account", async () => {
    renderAccount(accountOf("robinhood"), { llRobinhoodDisclaimer: { enabled: true } });

    expect(await screen.findByTestId(notice("robinhoodDisclaimer"))).toBeVisible();
    expect(
      screen.getByText("Total balance does not include dividends or stock splits."),
    ).toBeVisible();
  });

  it("does not show the Robinhood disclaimer on other accounts", async () => {
    renderAccount(accountOf("ethereum"), { llRobinhoodDisclaimer: { enabled: true } });

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.queryByTestId(notice("robinhoodDisclaimer"))).toBeNull();
  });
});
