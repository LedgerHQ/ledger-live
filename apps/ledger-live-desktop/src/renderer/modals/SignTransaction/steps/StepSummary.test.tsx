import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useLLDCoinFamily } from "~/renderer/families";
import type { StepProps } from "../types";
import StepSummary from "./StepSummary";

jest.mock("~/renderer/families");

const getMemoValue = (transaction: { memoValue?: string }) => transaction.memoValue;

const mockUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const status = {
  errors: {},
  warnings: {},
  amount: new BigNumber(1000),
  estimatedFees: new BigNumber(10),
  totalSpent: new BigNumber(1010),
} as unknown as TransactionStatus;

const makeProps = (currencyId: string, transaction: Record<string, unknown>): StepProps =>
  ({
    t: (key: string) => key,
    account: genAccount(`sign-summary-${currencyId}`, {
      currency: getCryptoCurrencyById(currencyId),
    }),
    parentAccount: null,
    transaction: {
      amount: new BigNumber(1000),
      recipient: "recipient-address",
      useAllAmount: false,
      ...transaction,
    } as unknown as Transaction,
    status,
  }) as unknown as StepProps;

describe("SignTransaction/StepSummary memo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the cosmos memo read through the family slot", () => {
    mockUseLLDCoinFamily.mockReturnValue({ getMemoValue } as never);

    render(
      <StepSummary {...makeProps("cosmos", { family: "cosmos", memoValue: "Cosmos memo" })} />,
    );

    expect(screen.getByText("Cosmos memo")).toBeVisible();
  });

  it("falls back to the memo field when the family has no slot", () => {
    mockUseLLDCoinFamily.mockReturnValue({} as never);

    render(
      <StepSummary {...makeProps("algorand", { family: "algorand", memo: "Algorand memo" })} />,
    );

    expect(screen.getByText("Algorand memo")).toBeVisible();
  });

  it("shows no memo row when the transaction has no memo", () => {
    mockUseLLDCoinFamily.mockReturnValue({ getMemoValue } as never);

    render(<StepSummary {...makeProps("cosmos", { family: "cosmos" })} />);

    expect(screen.queryByText("Memo")).not.toBeInTheDocument();
  });
});
