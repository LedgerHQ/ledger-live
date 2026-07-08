import React from "react";
import { render, screen } from "@tests/test-renderer";
import { QuickAmountSelector } from "../QuickAmountSelector";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

const mockUpdateTransaction = jest.fn();

describe("QuickAmountSelector", () => {
  const mockAccount = {} as never;

  it("renders null for non-aleo transaction", () => {
    const { toJSON } = render(
      <QuickAmountSelector
        account={mockAccount}
        transaction={{ family: "ethereum" } as Transaction}
        updateTransaction={mockUpdateTransaction}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders null for aleo public transaction", () => {
    const { toJSON } = render(
      <QuickAmountSelector
        account={mockAccount}
        transaction={{ family: "aleo", mode: "transfer_public" } as Transaction}
        updateTransaction={mockUpdateTransaction}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders for aleo private transaction", () => {
    render(
      <QuickAmountSelector
        account={mockAccount}
        transaction={{ family: "aleo", mode: "transfer_private" } as Transaction}
        updateTransaction={mockUpdateTransaction}
      />,
    );

    expect(screen.getByText("Quick amount selector mock")).toBeOnTheScreen();
  });
});
