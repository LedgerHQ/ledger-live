import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const btcAccount = genAccount("account-detail-view-explorer-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccountDetail(account: Account) {
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
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

describe("AccountDetail view explorer", () => {
  it("shows View Explorer in the settings sheet when the currency has an explorer", async () => {
    const { user } = renderAccountDetail(btcAccount);

    await user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));

    expect(screen.getByText("View Explorer")).toBeVisible();
  });

  it("hides View Explorer when the currency has no explorer", async () => {
    const account: Account = {
      ...btcAccount,
      currency: { ...btcAccount.currency, explorerViews: [] },
    };
    const { user } = renderAccountDetail(account);

    await user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByText("View Explorer")).toBeNull();
  });
});
