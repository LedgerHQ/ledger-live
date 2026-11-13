import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1 } from "~/families/aleo/__mocks__/account.mock";
import { makePrivateAleoTransaction } from "~/families/aleo/__mocks__/transaction.mock";
import {
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
} from "~/families/xrp/__mocks__/account.mock";
import { FamilyAmountFooterRow } from "../FamilyAmountFooterRow";

const aleoTransaction = makePrivateAleoTransaction(1, null);

const xrpTokenTransaction = {
  family: "xrp",
  amount: new BigNumber(100),
  recipient: "rRecipient",
  subAccountId: XRP_IOU_TOKEN_ACCOUNT.id,
} as Transaction;

const xrpTokenStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(12),
  amount: new BigNumber(100),
  totalSpent: new BigNumber(102),
} as TransactionStatus;

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

  it("passes the transaction status to the family's footer row", () => {
    render(
      <FamilyAmountFooterRow
        account={XRP_IOU_TOKEN_ACCOUNT}
        parentAccount={XRP_ACCOUNT_WITH_TOKEN}
        transaction={xrpTokenTransaction}
        status={xrpTokenStatus}
      />,
    );

    expect(screen.getByText("Issuer fee")).toBeVisible();
    expect(screen.getByTestId("xrp-send-issuer-fee-value")).toHaveTextContent("2 RLUSD");
  });
});
