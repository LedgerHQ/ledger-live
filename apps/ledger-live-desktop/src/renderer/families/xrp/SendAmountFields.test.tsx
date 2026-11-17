import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import sendAmountFields from "./SendAmountFields";
import { XRP_ACCOUNT } from "./__mocks__/account.mock";

const SendAmountFields = sendAmountFields.component;

function renderFields(errors: Record<string, Error>) {
  const status = {
    errors,
    warnings: {},
    amount: new BigNumber(1),
    totalSpent: new BigNumber(1),
    estimatedFees: new BigNumber(12),
  } as TransactionStatus;

  return render(
    <SendAmountFields
      account={XRP_ACCOUNT}
      parentAccount={null}
      transaction={{ family: "xrp" } as Transaction}
      status={status}
      onChange={jest.fn()}
      updateTransaction={jest.fn()}
    />,
  );
}

function makeError(name: string) {
  const error = new Error(name);
  error.name = name;

  return error;
}

describe("xrp SendAmountFields", () => {
  it("shows a dry-run recipient error on the amount step", () => {
    renderFields({ recipient: makeError("XrpTokenCannotReceive") });

    expect(screen.getByTestId("xrp-send-amount-error")).toBeInTheDocument();
  });

  it("shows a transaction error on the amount step", () => {
    renderFields({ transaction: makeError("XrpTransactionWouldFail") });

    expect(screen.getByTestId("xrp-send-amount-error")).toBeInTheDocument();
  });

  it("shows nothing for an amount error, which the amount field shows", () => {
    renderFields({ amount: makeError("NotEnoughBalance") });

    expect(screen.queryByTestId("xrp-send-amount-error")).not.toBeInTheDocument();
  });
});
