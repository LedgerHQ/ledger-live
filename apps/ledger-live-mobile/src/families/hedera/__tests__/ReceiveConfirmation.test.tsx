import React from "react";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import ReceiveConfirmation from "~/screens/ReceiveFunds/03-Confirmation";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";
import { HEDERA_ACCOUNT_1, HEDERA_ASSOCIATED_SUBACCOUNT } from "../__mocks__/account.mock";
import { hederaCurrency, htsToken } from "../__mocks__/currency.mock";

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();

function renderReceiveConfirmation(
  params: ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation],
) {
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
    [
      "token from receive drawer",
      { accountId: HEDERA_ACCOUNT_1.id, parentId: HEDERA_ACCOUNT_1.id, currency: htsToken },
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

  it("hides the association alert from receive drawer when the token is already associated", async () => {
    renderReceiveConfirmation({
      accountId: HEDERA_ACCOUNT_1.id,
      parentId: HEDERA_ACCOUNT_1.id,
      currency: htsToken,
    });

    await screen.findByText(/cannot be confirmed on your Ledger device/);
    expect(screen.queryByText(/your account needs to be associated/)).toBeNull();
  });

  it("shows the association alert from receive drawer when the token is not associated", async () => {
    renderReceiveConfirmation({
      accountId: HEDERA_ACCOUNT_1.id,
      parentId: HEDERA_ACCOUNT_1.id,
      currency: { ...htsToken, id: TokenCurrencyIdSchema.parse("hedera/hts/other_0.0.999") },
    });

    expect(await screen.findByText(/your account needs to be associated/)).toBeVisible();
  });
});
