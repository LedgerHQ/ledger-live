import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, withFlagOverrides } from "tests/testSetup";
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
    account: genAccount(`send-summary-${currencyId}`, {
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
    transitionTo: jest.fn(),
    currencyName: currencyId,
  }) as unknown as StepProps;

const renderSummary = (props: StepProps, memoTagEnabled: boolean) =>
  render(<StepSummary {...props} />, {
    initialState: withFlagOverrides({ lldMemoTag: { enabled: memoTagEnabled } }),
  });

describe("Send/StepSummary memo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])(
    "shows the cosmos memo read through the family slot when lldMemoTag enabled is %s",
    memoTagEnabled => {
      mockUseLLDCoinFamily.mockReturnValue({ getMemoValue } as never);

      renderSummary(
        makeProps("cosmos", { family: "cosmos", memoValue: "Cosmos memo" }),
        memoTagEnabled,
      );

      expect(screen.getByText("Cosmos memo")).toBeVisible();
    },
  );

  it("falls back to the memo field when the family has no slot and lldMemoTag is disabled", () => {
    mockUseLLDCoinFamily.mockReturnValue({} as never);

    renderSummary(makeProps("algorand", { family: "algorand", memo: "Algorand memo" }), false);

    expect(screen.getByText("Algorand memo")).toBeVisible();
  });

  it("falls back to the memo tag helper when the family has no slot and lldMemoTag is enabled", () => {
    mockUseLLDCoinFamily.mockReturnValue({} as never);

    renderSummary(makeProps("stellar", { family: "stellar", memoValue: "Stellar memo" }), true);

    expect(screen.getByText("Stellar memo")).toBeVisible();
  });

  it("shows no memo row when the cosmos transaction has no memo", () => {
    mockUseLLDCoinFamily.mockReturnValue({ getMemoValue } as never);

    renderSummary(makeProps("cosmos", { family: "cosmos" }), false);

    expect(screen.queryByText("Memo")).not.toBeInTheDocument();
  });
});
