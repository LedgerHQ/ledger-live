import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { BitcoinAccount, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
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

  it("truncates multi-byte input to whole characters that fit within 512 bytes", () => {
    const { onChange, input } = renderField();
    // "あ" is 3 bytes in UTF-8; 200 of them = 600 bytes, over the 512-byte budget.
    const memo = "あ".repeat(200);

    fireEvent.change(input, { target: { value: memo } });

    const result = changedMemo(onChange);
    expect(byteLength(result)).toBeLessThanOrEqual(512);
    // 170 chars = 510 bytes fit; a 171st (513 bytes) would overflow.
    expect(result).toBe("あ".repeat(170));
  });

  it("does not split surrogate-pair characters at the byte boundary", () => {
    const { onChange, input } = renderField();
    // "😀" is 4 bytes in UTF-8; 128 of them = 512 bytes exactly.
    const memo = "😀".repeat(200);

    fireEvent.change(input, { target: { value: memo } });

    const result = changedMemo(onChange);
    expect(byteLength(result)).toBe(512);
    expect(result).toBe("😀".repeat(128));
    // No lone surrogate: every code point is above the BMP.
    expect([...result].every(char => (char.codePointAt(0) ?? 0) > 0xffff)).toBe(true);
  });
});
