import React from "react";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { render, screen } from "@tests/test-renderer";
import BitcoinSendRowsFee from "./SendRowsFee";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
}));

const account = genAccount("bitcoin-send-rows-fee", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const mockUpdateTransaction = jest.fn(
  (tx: BitcoinTransaction, patch: Partial<BitcoinTransaction>) => ({ ...tx, ...patch }),
);

function createTransaction(overrides?: Partial<BitcoinTransaction>): BitcoinTransaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(1000),
    recipient: "bc1qrecipient",
    feesStrategy: "custom",
    familySpecificData: { feePerByte: "7" },
    feeParameters: { feeRates: { slow: "1", medium: "2", fast: "3" } },
    ...overrides,
  };
}

function renderRows(transaction: BitcoinTransaction) {
  const setTransaction = jest.fn();
  const { user } = render(
    <BitcoinSendRowsFee
      account={account}
      transaction={transaction}
      setTransaction={setTransaction}
      navigation={{ navigate: jest.fn() } as never}
      route={{ params: {} } as never}
    />,
  );
  return { setTransaction, user };
}

describe("BitcoinSendRowsFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAccountBridge).mockReturnValue({
      updateTransaction: mockUpdateTransaction,
    } as never);
  });

  it("should show the custom rate when the custom strategy is selected", () => {
    renderRows(createTransaction());

    expect(screen.getByText("Custom")).toBeVisible();
    expect(screen.getByText("7 sat/vByte")).toBeVisible();
  });

  it("should show the rate of the last estimation when the custom strategy is selected", () => {
    renderRows(
      createTransaction({
        feeParameters: { feeRates: { slow: "1", medium: "2", fast: "3" }, feePerByte: "8" },
      }),
    );

    expect(screen.getByText("8 sat/vByte")).toBeVisible();
  });

  it("should only change the strategy when a preset is selected", async () => {
    const transaction = createTransaction();
    const { setTransaction, user } = renderRows(transaction);

    await user.press(screen.getByText("fast"));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(transaction, { feesStrategy: "fast" });
    expect(setTransaction).toHaveBeenCalledWith({ ...transaction, feesStrategy: "fast" });
  });
});
