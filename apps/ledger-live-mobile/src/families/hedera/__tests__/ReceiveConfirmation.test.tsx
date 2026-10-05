import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import ReceiveConfirmation from "~/screens/ReceiveFunds/03-Confirmation";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";
import { HEDERA_ACCOUNT_1, HEDERA_ASSOCIATED_SUBACCOUNT } from "../__mocks__/account.mock";
import { hederaCurrency, htsToken } from "../__mocks__/currency.mock";

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();

function renderReceiveConfirmation(params: { accountId: string; parentId?: string }) {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        initialParams={params}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [{ ...HEDERA_ACCOUNT_1, subAccounts: [HEDERA_ASSOCIATED_SUBACCOUNT] }],
        },
      }),
    },
  );
}

describe("Hedera ReceiveConfirmation", () => {
  it.each([
    ["main account", { accountId: HEDERA_ACCOUNT_1.id }, hederaCurrency],
    [
      "token account",
      {
        accountId: HEDERA_ASSOCIATED_SUBACCOUNT.id,
        parentId: HEDERA_ASSOCIATED_SUBACCOUNT.parentId,
      },
      htsToken,
    ],
  ])("shows the Hedera receive screen for a %s", async (_, params, currency) => {
    renderReceiveConfirmation(params);

    expect(await screen.findByText(/cannot be confirmed on your Ledger device/)).toBeVisible();
    expect(screen.queryByTestId("button-receive-confirmation")).toBeNull();
    expect(screen.getByTestId(`receive-confirmation-title-${currency.ticker}`)).toBeVisible();
    expect(screen.getByText("On Hedera")).toBeVisible();
    expect(screen.getByTestId(`receive-currency-icon-${currency.id}`)).toBeVisible();
  });
});
