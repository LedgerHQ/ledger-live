import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, fireEvent } from "tests/testSetup";
import { track } from "@shared/analytics";
import type {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import MemoValueField from "../MemoValueField";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction => ({
      ...tx,
      ...patch,
    }),
  }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

// oxlint-disable-next-line typescript/consistent-type-assertions
const transaction = { family: "cardano", memo: "" } as unknown as Transaction;
// oxlint-disable-next-line typescript/consistent-type-assertions
const status = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
} as unknown as TransactionStatus;

describe("MemoValueField", () => {
  it("tracks the input without the memo text", () => {
    const onChange = jest.fn();
    render(
      <MemoValueField
        // oxlint-disable-next-line typescript/consistent-type-assertions
        account={{} as CardanoAccount}
        transaction={transaction}
        status={status}
        onChange={onChange}
        trackProperties={{ flow: "send" }}
      />,
    );

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "payment ref" } });

    expect(track).toHaveBeenCalledWith("button_clicked2", {
      flow: "send",
      button: "input",
      hasMemo: true,
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ memo: "payment ref" }));
  });
});
