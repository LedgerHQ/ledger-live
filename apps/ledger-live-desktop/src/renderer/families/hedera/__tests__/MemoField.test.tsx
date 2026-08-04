import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, fireEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";
import MemoField from "../MemoField";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";
import { makeHederaTransaction } from "../__mocks__/transaction.mock";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction =>
      ({
        ...tx,
        ...patch,
      }) as Transaction,
  }),
}));

jest.mock("~/renderer/analytics/segment", () => ({ track: jest.fn() }));

const makeStatus = (overrides: Partial<TransactionStatus> = {}): TransactionStatus => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
  ...overrides,
});

const defaultState = {
  settings: AFTER_ONBOARDING_STATE,
  accounts: [HEDERA_ACCOUNT_1],
};

describe("MemoField", () => {
  describe("without status", () => {
    it("renders nothing", () => {
      const { container } = render(
        <MemoField
          account={HEDERA_ACCOUNT_1}
          transaction={makeHederaTransaction()}
          onChange={jest.fn()}
          status={undefined as never}
        />,
        { initialState: defaultState },
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("with status", () => {
    it("renders the memo text input", () => {
      render(
        <MemoField
          account={HEDERA_ACCOUNT_1}
          transaction={makeHederaTransaction()}
          onChange={jest.fn()}
          status={makeStatus()}
        />,
        { initialState: defaultState },
      );
      expect(screen.getByRole("textbox")).toBeVisible();
    });

    it("displays the current memo value", () => {
      render(
        <MemoField
          account={HEDERA_ACCOUNT_1}
          transaction={makeHederaTransaction({ memo: "prefilled memo" })}
          onChange={jest.fn()}
          status={makeStatus()}
        />,
        { initialState: defaultState },
      );
      expect(screen.getByRole("textbox")).toHaveValue("prefilled memo");
    });

    it("calls onChange with the updated transaction when the user types", () => {
      const handleChange = jest.fn();

      render(
        <MemoField
          account={HEDERA_ACCOUNT_1}
          transaction={makeHederaTransaction({ memo: "" })}
          onChange={handleChange}
          status={makeStatus()}
        />,
        { initialState: defaultState },
      );

      fireEvent.change(screen.getByRole("textbox"), { target: { value: "payment ref" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ memo: "payment ref" }));
    });

    it("shows an inline error when status.errors.transaction is set", () => {
      render(
        <MemoField
          account={HEDERA_ACCOUNT_1}
          transaction={makeHederaTransaction()}
          onChange={jest.fn()}
          status={makeStatus({ errors: { transaction: new Error("Memo too long") } })}
        />,
        { initialState: defaultState },
      );
      expect(screen.getByTestId("input-error")).toBeVisible();
    });
  });
});
