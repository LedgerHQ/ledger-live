import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import DebugPayContactSuccess from "../PayContactSuccess";

const goBack = jest.fn();
const navigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack, navigate }),
}));

const account = genAccount("debug-pay-success-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
});

describe("DebugPayContactSuccess", () => {
  beforeEach(() => {
    goBack.mockClear();
    navigate.mockClear();
  });

  it("should open the Pay success screen with a saved contact", async () => {
    const ada = mockContactWithAddress({ id: "contact-ada", name: "Ada" });

    const { user } = render(<DebugPayContactSuccess />, {
      overrideInitialState: (state: State) => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
        contacts: { contacts: [mockMeContact(), ada] },
      }),
    });

    expect(await screen.findByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText(/You paid \(Ada\)/)).toBeVisible();
    expect(screen.getByText("Amount")).toBeVisible();
    expect(screen.getByText("Est. time")).toBeVisible();
    expect(screen.getByText("From")).toBeVisible();
    expect(screen.getByTestId("pay-success-view-transaction")).toBeVisible();

    await user.press(screen.getByTestId("pay-success-view-transaction"));
    expect(navigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: account.operations[0],
    });

    await user.press(screen.getByTestId("pay-success-close"));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
