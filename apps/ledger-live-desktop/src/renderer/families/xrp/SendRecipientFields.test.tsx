import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, screen, fireEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import SendRecipientFields from "./SendRecipientFields";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction => ({
      ...tx,
      ...patch,
    }),
  }),
}));

const TagField = SendRecipientFields.component;
const account = genAccount("xrp-test", { currency: getCryptoCurrencyById("ripple") });

const transaction: Transaction = {
  family: "xrp",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  networkInfo: null,
  tag: 42,
};

const status: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

const typeTag = (value: string) => {
  const onChange = jest.fn();
  render(
    <TagField account={account} transaction={transaction} status={status} onChange={onChange} />,
    {
      initialState: { settings: AFTER_ONBOARDING_STATE, accounts: [account] },
    },
  );
  fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value } });
  return onChange;
};

describe("XRP TagField", () => {
  it.each([
    ["123", 123],
    ["", undefined],
    ["abc", 42],
    ["99999999999", 42],
  ])("maps the typed tag %p to %p without throwing", (value, expected) => {
    expect(typeTag(value)).toHaveBeenCalledWith(expect.objectContaining({ tag: expected }));
  });
});
