import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import TransactionConfirmFields from "../TransactionConfirmFields";

const CasperExtendedAmountField = TransactionConfirmFields.fieldComponents["casper.extendedAmount"];

const account = {
  type: "Account",
  id: "js:2:casper:0202:casper",
  currency: {
    type: "CryptoCurrency",
    id: "casper",
    family: "casper",
    name: "Casper",
    ticker: "CSPR",
    units: [
      { name: "CSPR", code: "CSPR", magnitude: 9 },
      { name: "motes", code: "motes", magnitude: 0 },
    ],
  },
} as unknown as Account;

const transaction = {
  family: "casper",
  amount: new BigNumber(500),
  fees: new BigNumber(100),
  recipient: "",
  useAllAmount: false,
} as Transaction;

const status = {} as TransactionStatus;

describe("casper TransactionConfirmFields", () => {
  it("renders the extended amount inside a Text node so the value is visible", () => {
    render(
      <CasperExtendedAmountField
        account={account}
        transaction={transaction}
        status={status}
        field={{ type: "casper.extendedAmount", label: "Amount", value: new BigNumber(500) }}
      />,
    );

    expect(screen.getByText("Amount")).toBeOnTheScreen();
    expect(screen.getByText("500 motes")).toBeOnTheScreen();
  });
});
