import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getOriginalTxFeeRateSatVb } from "@ledgerhq/live-common/families/bitcoin/editTransaction/rbfValidation";
import type {
  TransactionRaw,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { render, waitFor } from "tests/testSetup";
import Body from "../Body";

const mockStatus: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

const mockGetEditTransactionStatus = jest.fn(({ status }: { status: TransactionStatus }) => status);
const mockBridge = {
  isTransactionConfirmed: () => Promise.resolve(false),
  hasMinimumFundsToCancel: () => Promise.resolve(false),
  hasMinimumFundsToSpeedUp: () => Promise.resolve(false),
  getEditTransactionStatus: mockGetEditTransactionStatus,
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => mockBridge,
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: (_bridge: unknown, init: () => Record<string, unknown>) => ({
    ...init(),
    setTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    status: mockStatus,
    bridgeError: null,
    bridgePending: false,
  }),
}));

jest.mock("@ledgerhq/live-common/families/bitcoin/editTransaction/rbfValidation", () => ({
  getOriginalTxFeeRateSatVb: jest.fn(),
}));

jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: () => null,
}));

const account = genAccount("bitcoin-edit-body-account", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const renderBody = (familySpecificData: TransactionRaw["familySpecificData"]) =>
  render(
    <Body
      stepId="method"
      onChangeStepId={jest.fn()}
      params={{
        account,
        parentAccount: undefined,
        transactionRaw: {
          family: "bitcoin",
          amount: "0",
          recipient: account.freshAddress,
          familySpecificData,
        },
        transactionHash: "pending-hash",
      }}
    />,
  );

describe("bitcoin EditTransaction Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getOriginalTxFeeRateSatVb).mockResolvedValue(new BigNumber(4));
  });

  it("fetches the fee rate of the replaced transaction when the edited one has none", async () => {
    renderBody({ rbf: true, replaceTxId: "pending-hash" });

    expect(getOriginalTxFeeRateSatVb).toHaveBeenCalledWith(account, "pending-hash");
    await waitFor(() =>
      expect(mockGetEditTransactionStatus).toHaveBeenLastCalledWith(
        expect.objectContaining({ originalFeePerByte: new BigNumber(4) }),
      ),
    );
  });

  it("validates against the fee rate of the edited transaction when it carries one", () => {
    renderBody({ rbf: true, replaceTxId: "pending-hash", feePerByte: "6" });

    expect(getOriginalTxFeeRateSatVb).not.toHaveBeenCalled();
    expect(mockGetEditTransactionStatus).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ originalFeePerByte: expect.anything() }),
    );
  });

  it("does not fetch a fee rate without a transaction to replace", () => {
    renderBody({ rbf: true });

    expect(getOriginalTxFeeRateSatVb).not.toHaveBeenCalled();
  });
});
