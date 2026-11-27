import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { BitcoinAccount, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { ZcashMemoTooLong } from "@ledgerhq/coin-zcash/types";
import ZcashMemoField from "../ZcashMemoField";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const account = createFixtureAccount() as BitcoinAccount;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

const renderField = (memo = "") => {
  const onChange = jest.fn();
  render(
    <ZcashMemoField
      account={account as never}
      transaction={{ family: "bitcoin", memo } as never}
      status={{ errors: {}, warnings: {} } as never}
      onChange={onChange}
    />,
  );
  return { onChange, input: screen.getByTestId("memo-tag-input") as HTMLInputElement };
};

const changedMemo = (onChange: jest.Mock) => (onChange.mock.calls[0][0] as { memo: string }).memo;

describe("ZcashMemoField", () => {
  it("passes an ASCII memo within the 512-byte limit through unchanged", () => {
    const { onChange, input } = renderField();
    const memo = "hello shielded world";

    fireEvent.change(input, { target: { value: memo } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(changedMemo(onChange)).toBe(memo);
  });

  it("passes a memo that is exactly 512 bytes through unchanged", () => {
    const { onChange, input } = renderField();
    const memo = "a".repeat(512);

    fireEvent.change(input, { target: { value: memo } });

    expect(changedMemo(onChange)).toBe(memo);
    expect(byteLength(changedMemo(onChange))).toBe(512);
  });

  it("keeps a memo over 512 bytes intact so the bridge can reject it", () => {
    const { onChange, input } = renderField();
    const memo = "あ".repeat(200);

    fireEvent.change(input, { target: { value: memo } });

    expect(changedMemo(onChange)).toBe(memo);
    expect(byteLength(changedMemo(onChange))).toBe(600);
  });

  it("does not cap the input length natively", () => {
    const { input } = renderField();

    expect(input).not.toHaveAttribute("maxlength");
  });

  it("shows the bridge error for a memo over 512 bytes", () => {
    const memo = "a".repeat(513);
    render(
      <ZcashMemoField
        account={account as never}
        transaction={{ family: "bitcoin", memo } as never}
        status={{ errors: { transaction: new ZcashMemoTooLong(512) }, warnings: {} } as never}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Memo must not exceed 512 bytes")).toBeVisible();
  });
});
