import React from "react";
import { render } from "@testing-library/react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import XrpAfterAmountInput from "./AfterAmountInput";

jest.mock("~/logic/screenTransactionHooks", () => ({
  useTransactionChangeFromNavigation: jest.fn(),
}));

const mockUseTransactionChangeFromNavigation = jest.mocked(useTransactionChangeFromNavigation);

const props = {
  account: {} as never,
  transaction: {} as never,
  maxSpendable: null,
};

describe("XrpAfterAmountInput", () => {
  beforeEach(() => mockUseTransactionChangeFromNavigation.mockClear());

  it("renders nothing", () => {
    const { toJSON } = render(<XrpAfterAmountInput {...props} updateTransaction={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it("re-applies a navigation-pushed transaction to the amount step (LIVE-35403)", () => {
    const updateTransaction = jest.fn();
    render(<XrpAfterAmountInput {...props} updateTransaction={updateTransaction} />);

    expect(mockUseTransactionChangeFromNavigation).toHaveBeenCalledTimes(1);

    const setTransaction = mockUseTransactionChangeFromNavigation.mock.calls[0][0];
    const pushed = { family: "ripple", tag: 123 } as unknown as Transaction;
    setTransaction(pushed);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0] as (t: Transaction) => Transaction;
    expect(updater({ family: "ripple", tag: 1 } as unknown as Transaction)).toBe(pushed);
  });
});
