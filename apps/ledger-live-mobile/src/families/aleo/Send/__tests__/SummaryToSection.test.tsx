import React from "react";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { render, screen } from "@tests/test-renderer";
import { SummaryToSection } from "../SummaryToSection";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";

const mockUseMaybeAccountName = jest.fn();

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useMaybeAccountName: (...args: Parameters<typeof mockUseMaybeAccountName>) =>
    mockUseMaybeAccountName(...args),
}));

const currency = ALEO_ACCOUNT_1.currency;

describe("SummaryToSection", () => {
  beforeEach(() => {
    mockUseMaybeAccountName.mockReturnValue(undefined);
  });

  it("shows recipient address for a regular send", () => {
    const transaction = {
      family: "aleo",
      mode: "transfer_public",
      recipient: "aleo1abc123",
    } as Transaction;

    render(
      <SummaryToSection
        transaction={transaction}
        currency={currency}
        account={ALEO_ACCOUNT_1}
        parentAccount={undefined}
      />,
    );

    expect(screen.getByText("aleo1abc123")).toBeOnTheScreen();
  });

  it("shows account name for a self-transfer when the account is found", () => {
    mockUseMaybeAccountName.mockReturnValue("My Aleo Account");

    const transaction = {
      family: "aleo",
      mode: "convert_public_to_private",
      recipient: ALEO_ACCOUNT_1.freshAddress,
    } as Transaction;

    render(
      <SummaryToSection
        transaction={transaction}
        currency={currency}
        account={ALEO_ACCOUNT_1}
        parentAccount={undefined}
      />,
    );

    expect(screen.getByText("My Aleo Account")).toBeOnTheScreen();
  });
});
