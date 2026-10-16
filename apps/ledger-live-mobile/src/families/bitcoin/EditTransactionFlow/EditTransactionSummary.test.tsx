import React from "react";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getOriginalTxFeeRateSatVb } from "@ledgerhq/live-common/families/bitcoin/editTransaction/rbfValidation";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { render, waitFor } from "@tests/test-renderer";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import { useFromTransactionRaw } from "~/hooks/useFromTransactionRaw";
import BitcoinEditTransactionSummary from "./EditTransactionSummary";

jest.mock("@ledgerhq/live-common/families/bitcoin/editTransaction/rbfValidation", () => ({
  getOriginalTxFeeRateSatVb: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

jest.mock("~/hooks/useFromTransactionRaw", () => ({
  useFromTransactionRaw: jest.fn(),
}));

jest.mock("~/logic/screenTransactionHooks", () => ({
  useTransactionChangeFromNavigation: jest.fn(),
}));

jest.mock("~/components/EditTransaction/EditTransactionSummaryView", () => ({
  __esModule: true,
  default: () => null,
}));

const account = genAccount("bitcoin-edit-summary", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const status = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(500),
  amount: new BigNumber(1000),
  totalSpent: new BigNumber(1500),
};

const transaction: BitcoinTransaction = {
  family: "bitcoin",
  amount: new BigNumber(1000),
  recipient: "bc1qrecipient",
  feesStrategy: "fast",
  familySpecificData: { rbf: true, replaceTxId: "original-hash" },
};

const mockGetEditTransactionStatus = jest.fn((params: { status: unknown }) => params.status);

function renderSummary(transactionToUpdate: BitcoinTransaction) {
  jest.mocked(useFromTransactionRaw).mockReturnValue(transactionToUpdate);
  const route = {
    params: {
      accountId: account.id,
      transaction,
      transactionRaw: { family: "bitcoin", amount: "0", recipient: account.freshAddress },
      currentNavigation: ScreenName.EditTransactionSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      editType: "speedup",
    },
  };
  render(
    <BitcoinEditTransactionSummary
      navigation={{ navigate: jest.fn() } as never}
      route={route as never}
    />,
  );
}

describe("BitcoinEditTransactionSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAccountScreen).mockReturnValue({ account, parentAccount: undefined });
    jest.mocked(useAccountBridge).mockReturnValue({
      getEditTransactionStatus: mockGetEditTransactionStatus,
    } as never);
    jest.mocked(useBridgeTransaction).mockReturnValue({
      transaction,
      setTransaction: jest.fn(),
      status,
      bridgePending: false,
      bridgeError: null,
    } as never);
    jest.mocked(getOriginalTxFeeRateSatVb).mockResolvedValue(new BigNumber(4));
  });

  it("should validate against the fetched original rate when the replaced transaction's rate is unknown", async () => {
    renderSummary({
      ...transaction,
      familySpecificData: { rbf: true, replaceTxId: "original-hash" },
    });

    await waitFor(() => {
      expect(mockGetEditTransactionStatus).toHaveBeenLastCalledWith(
        expect.objectContaining({ originalFeePerByte: new BigNumber(4) }),
      );
    });
    expect(getOriginalTxFeeRateSatVb).toHaveBeenCalledWith(account, "original-hash");
  });

  it("should not fetch the original rate when the replaced transaction's rate is known", () => {
    renderSummary({
      ...transaction,
      familySpecificData: { rbf: true, replaceTxId: "original-hash", feePerByte: "6" },
    });

    expect(getOriginalTxFeeRateSatVb).not.toHaveBeenCalled();
    expect(mockGetEditTransactionStatus).toHaveBeenCalledWith(
      expect.not.objectContaining({ originalFeePerByte: expect.anything() }),
    );
  });

  it("should not fetch the original rate when the transaction replaces nothing", () => {
    renderSummary({ ...transaction, familySpecificData: { rbf: true } });

    expect(getOriginalTxFeeRateSatVb).not.toHaveBeenCalled();
  });
});
