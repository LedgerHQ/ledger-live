import React from "react";
import { render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1 } from "~/families/aleo/__mocks__/account.mock";
import { makePrivateAleoTransaction } from "~/families/aleo/__mocks__/transaction.mock";
import { FamilyAmountFooterRow } from "../FamilyAmountFooterRow";

const aleoTransaction = makePrivateAleoTransaction(1, null);

describe("FamilyAmountFooterRow", () => {
  it("renders the family's footer row for an Aleo account", () => {
    render(
      <FamilyAmountFooterRow
        account={ALEO_ACCOUNT_1}
        parentAccount={null}
        transaction={aleoTransaction}
      />,
    );

    expect(screen.getByTestId("aleo-send-estimated-time-row")).toBeVisible();
    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~13 s");
  });

  it("resolves the family from the parent of a token account", () => {
    render(
      <FamilyAmountFooterRow
        account={ALEO_TOKEN_ACCOUNT_1}
        parentAccount={ALEO_ACCOUNT_1}
        transaction={aleoTransaction}
      />,
    );

    expect(screen.getByTestId("aleo-send-estimated-time-row")).toBeVisible();
  });

  it("renders nothing for a family without a footer row", () => {
    const account = genAccount("footer-row-ethereum", {
      currency: getCryptoCurrencyById("ethereum"),
    });

    render(
      <FamilyAmountFooterRow
        account={account}
        parentAccount={null}
        transaction={aleoTransaction}
      />,
    );

    expect(screen.queryByTestId("aleo-send-estimated-time-row")).toBeNull();
  });
});
