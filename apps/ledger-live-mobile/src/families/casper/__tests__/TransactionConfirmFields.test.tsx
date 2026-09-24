import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import TransactionConfirmFields from "../TransactionConfirmFields";

const CasperExtendedAmountField = TransactionConfirmFields.fieldComponents["casper.extendedAmount"];

const account = genAccount("casper-1", { currency: getCryptoCurrencyById("casper") });

const transaction = { family: "casper" } as Transaction;

const status = {} as TransactionStatus;

const rows: Array<[label: string, value: BigNumber, formatted: string]> = [
  ["Fee", new BigNumber(100), "100 motes"],
  ["Amount", new BigNumber(500), "500 motes"],
];

describe("casper TransactionConfirmFields", () => {
  it.each(rows)(
    "renders the %s inside a Text node so the value is visible",
    (label, value, formatted) => {
      render(
        <CasperExtendedAmountField
          account={account}
          transaction={transaction}
          status={status}
          field={{ type: "casper.extendedAmount", label, value }}
        />,
      );

      expect(screen.getByText(label)).toBeOnTheScreen();
      expect(screen.getByText(formatted)).toBeOnTheScreen();
    },
  );
});
