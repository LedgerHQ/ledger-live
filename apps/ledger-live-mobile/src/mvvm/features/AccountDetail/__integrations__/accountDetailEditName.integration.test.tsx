import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const btcAccount = genAccount("account-detail-edit-name-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccountDetail() {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: btcAccount.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [btcAccount] },
          wallet: {
            ...withFlag.wallet,
            accountNames: new Map([[parseAnyAccountId(btcAccount.id), "Bitcoin 1"]]),
          },
        };
      },
    },
  );
}

async function openEditName() {
  const view = renderAccountDetail();
  await view.user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
  await view.user.press(screen.getByTestId("account-settings-change-name"));
  return view;
}

describe("AccountDetail change name", () => {
  it("opens the change name screen prefilled with the account name", async () => {
    await openEditName();

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameScreen)).toBeVisible();
    expect(
      screen.getByText(/Give this address a name to stay organized \(ex\. BTC-Trading/),
    ).toBeVisible();
    expect(screen.getByDisplayValue("Bitcoin 1")).toBeVisible();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameSubmit)).toBeDisabled();
  });

  it("renames the account and goes back to the account detail", async () => {
    const { user } = await openEditName();

    await user.clear(screen.getByDisplayValue("Bitcoin 1"));
    await user.type(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameInput), "  Savings  ");
    await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameSubmit));

    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameScreen)).toBeNull();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.navBarTitle)).toHaveTextContent("Savings");
  });

  it("keeps the name when going back without saving", async () => {
    const { user } = await openEditName();

    await user.clear(screen.getByDisplayValue("Bitcoin 1"));
    await user.type(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameInput), "Savings");
    await user.press(screen.getByTestId("navigation-header-back-button"));

    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameScreen)).toBeNull();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.navBarTitle)).toHaveTextContent("Bitcoin 1");
  });

  it("disables the button when the name is empty", async () => {
    const { user } = await openEditName();

    await user.clear(screen.getByDisplayValue("Bitcoin 1"));

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameSubmit)).toBeDisabled();
  });
});
