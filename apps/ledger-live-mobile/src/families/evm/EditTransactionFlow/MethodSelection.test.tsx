import React from "react";
import { Text } from "react-native";
import { render, waitFor } from "@tests/test-renderer";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { ScreenName } from "~/const";
import { MethodSelection } from "./MethodSelection";

jest.mock("@ledgerhq/coin-evm/editTransaction/index", () => ({
  getEditTransactionPatch: jest.fn(),
  hasMinimumFundsToCancel: jest.fn().mockReturnValue(false),
  hasMinimumFundsToSpeedUp: jest.fn().mockReturnValue(false),
  isTransactionConfirmed: jest.fn().mockResolvedValue(true),
}));

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  isOldestPendingOperation: jest.fn().mockReturnValue(true),
}));

jest.mock("@ledgerhq/live-common/account/index", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/account/index");
  return {
    ...actual,
    getMainAccount: jest.fn(),
  };
});

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn().mockReturnValue({
    updateTransaction: jest.fn(),
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/transaction/index", () => ({
  fromTransactionRaw: jest.fn().mockReturnValue({
    family: "evm",
    nonce: 1,
  }),
}));

jest.mock("@ledgerhq/live-env", () => {
  const actual = jest.requireActual("@ledgerhq/live-env");
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

jest.mock("@ledgerhq/logs", () => {
  const actual = jest.requireActual("@ledgerhq/logs");
  return {
    ...actual,
    log: jest.fn(),
  };
});

jest.mock("~/components/EditTransaction/MethodSelectionList", () => {
  return function MockMethodSelectionList() {
    return <Text>method-selection-list</Text>;
  };
});

const mockedGetMainAccount = jest.requireMock("@ledgerhq/live-common/account/index")
  .getMainAccount as jest.Mock;
const mockedUseBridgeTransaction = jest.requireMock(
  "@ledgerhq/live-common/bridge/useBridgeTransaction",
).default as jest.Mock;

describe("EVM MethodSelection", () => {
  it("navigates to already validated error when tx gets confirmed", async () => {
    const navigate = jest.fn();
    const account = { id: "account-id" };
    const parentAccount = { id: "parent-id" };
    const operation = { hash: "op-hash", transactionRaw: { family: "evm" } };

    mockedGetMainAccount.mockReturnValue({
      currency: { ticker: "ETH", blockAvgTime: 1 },
      balance: { toNumber: () => 10 },
    });
    mockedUseBridgeTransaction.mockReturnValue({
      transaction: { family: "evm", nonce: 1 },
      setTransaction: jest.fn(),
    });

    render(
      <MethodSelection
        navigation={{ navigate } as never}
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
