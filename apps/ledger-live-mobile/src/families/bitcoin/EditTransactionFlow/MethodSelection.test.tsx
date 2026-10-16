import React from "react";
import { Text } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { TransactionHasBeenValidatedError } from "@ledgerhq/live-common/errors";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { ScreenName } from "~/const";
import { MethodSelection } from "./MethodSelection";

jest.mock("@ledgerhq/ledger-wallet-framework/operation", () => ({
  isOldestBitcoinPendingOperation: jest.fn().mockReturnValue(true),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const bridge = {
    updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
    getEditTransactionPatch: jest.fn().mockResolvedValue({ feesStrategy: "fast" }),
    hasMinimumFundsToCancel: jest.fn().mockResolvedValue(false),
    hasMinimumFundsToSpeedUp: jest.fn().mockResolvedValue(false),
    isTransactionConfirmed: jest.fn().mockResolvedValue(true),
    getEditTransactionStatus: jest.fn(),
  };
  const settledPromise = Object.assign(Promise.resolve(bridge), {
    status: "fulfilled",
    value: bridge,
  });
  return {
    getAccountBridge: jest.fn().mockReturnValue(settledPromise),
  };
});

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/transaction/index", () => ({
  fromTransactionRaw: jest.fn().mockResolvedValue({
    family: "bitcoin",
    amount: "0",
    recipient: "mock-address",
    familySpecificData: { rbf: true, replaceTxId: "op-hash" },
  }),
}));

jest.mock("@shared/env", () => {
  const actual = jest.requireActual("@shared/env");
  return {
    ...actual,
    getEnv: jest.fn((key: string) => {
      if (key === "DEFAULT_TRANSACTION_POLLING_INTERVAL") {
        return 1000;
      }
      return actual.getEnv(key);
    }),
  };
});

jest.mock("~/components/EditTransaction/MethodSelectionList", () => {
  return function MockMethodSelectionList({ onSelect }: { onSelect: (value: string) => void }) {
    return <Text onPress={() => onSelect("speedup")}>method-selection-list</Text>;
  };
});

const mockedUseBridgeTransaction = jest.requireMock(
  "@ledgerhq/live-common/bridge/useBridgeTransaction",
).default as jest.Mock;

const account = {
  type: "Account",
  id: "account-id",
  freshAddress: "mock-address",
  currency: { ticker: "BTC", blockAvgTime: 1 },
  bitcoinResources: { utxos: [] },
};
const parentAccount = { id: "parent-id" };

const minimalTransactionRaw = {
  family: "bitcoin",
  amount: "0",
  recipient: "mock-address",
  familySpecificData: {
    rbf: true,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    replaceTxId: "op-hash",
  },
};

describe("Bitcoin MethodSelection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseBridgeTransaction.mockReturnValue({
      transaction: { family: "bitcoin" },
      setTransaction: jest.fn(),
    });
  });

  it("should start from a minimal replacement when the operation has no transaction", async () => {
    const operation = { hash: "op-hash", date: new Date().toISOString() };

    render(
      <MethodSelection
        navigation={{ navigate: jest.fn(), isFocused: () => false } as never}
        route={{ params: { operation, account, parentAccount } } as never}
      />,
    );

    await waitFor(() => {
      expect(fromTransactionRaw).toHaveBeenCalledWith(minimalTransactionRaw);
    });
  });

  it("should replace the operation's own hash when the operation has a transaction", async () => {
    const operation = {
      hash: "op-hash",
      date: new Date().toISOString(),
      transactionRaw: {
        family: "bitcoin",
        amount: "1000",
        recipient: "bc1qrecipient",
        familySpecificData: { rbf: true, feePerByte: "12", replaceTxId: "older-hash" },
      },
    };

    render(
      <MethodSelection
        navigation={{ navigate: jest.fn(), isFocused: () => false } as never}
        route={{ params: { operation, account, parentAccount } } as never}
      />,
    );

    await waitFor(() => {
      expect(fromTransactionRaw).toHaveBeenCalledWith({
        ...operation.transactionRaw,
        familySpecificData: { rbf: true, feePerByte: "12", replaceTxId: "op-hash" },
      });
    });
  });

  it("should navigate to the summary with the transaction to edit when a method is selected", async () => {
    const navigate = jest.fn();
    const operation = { hash: "op-hash", date: new Date().toISOString() };

    const { user } = render(
      <MethodSelection
        navigation={{ navigate, isFocused: () => false } as never}
        route={{ params: { operation, account, parentAccount } } as never}
      />,
    );

    await user.press(await screen.findByText("method-selection-list"));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(ScreenName.EditTransactionSummary, {
        accountId: "account-id",
        parentId: "parent-id",
        transaction: { family: "bitcoin" },
        transactionRaw: minimalTransactionRaw,
        currentNavigation: ScreenName.EditTransactionSummary,
        nextNavigation: ScreenName.SendSelectDevice,
        editType: "speedup",
      });
    });
  });

  it("navigates to already validated error when tx gets confirmed", async () => {
    const navigate = jest.fn();
    const operation = { hash: "op-hash", date: new Date().toISOString() };

    render(
      <MethodSelection
        navigation={{ navigate, isFocused: () => true } as never}
        route={{ params: { operation, account, parentAccount } } as never}
      />,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(ScreenName.TransactionAlreadyValidatedError, {
        error: expect.any(TransactionHasBeenValidatedError),
      });
    });
  });
});
