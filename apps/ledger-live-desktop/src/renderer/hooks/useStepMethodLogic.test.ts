import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { act, renderHook } from "tests/testSetup";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useStepMethodContinue, useStepMethodSelection } from "./useStepMethodLogic";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getAccountBridge: jest.fn(),
}));

describe("useStepMethodSelection", () => {
  it("sets edit type to speedup when speedup is available", () => {
    const setEditType = jest.fn();
    const { result } = renderHook(() =>
      useStepMethodSelection({
        haveFundToSpeedup: true,
        haveFundToCancel: true,
        isOldestEditableOperation: true,
        setEditType,
        learnMoreUrl: "https://example.com/learn-more",
      }),
    );

    act(() => {
      result.current.handleSpeedupClick();
    });

    expect(setEditType).toHaveBeenCalledWith("speedup");
  });

  it("does not set speedup when speedup is unavailable", () => {
    const setEditType = jest.fn();
    const { result } = renderHook(() =>
      useStepMethodSelection({
        haveFundToSpeedup: false,
        haveFundToCancel: true,
        isOldestEditableOperation: true,
        setEditType,
        learnMoreUrl: "https://example.com/learn-more",
      }),
    );

    act(() => {
      result.current.handleSpeedupClick();
    });

    expect(setEditType).not.toHaveBeenCalled();
  });

  it("opens learn more url", () => {
    const { result } = renderHook(
      () =>
        useStepMethodSelection({
          haveFundToSpeedup: true,
          haveFundToCancel: true,
          isOldestEditableOperation: true,
          setEditType: jest.fn(),
          learnMoreUrl: urls.editBitcoinTx.learnMore,
        }),
      {
        initialState: {
          settings: {
            language: "fr",
          },
        },
      },
    );

    act(() => {
      result.current.handleLearnMoreClick();
    });

    expect(openURL).toHaveBeenCalledWith(
      "https://support.ledger.com/fr/article/how-to-speed-up-or-cancel-pending-bitcoin-transactions",
    );
  });
});

describe("useStepMethodContinue", () => {
  const account = genAccount("test-account");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds and applies patch then transitions to summary", async () => {
    const transaction = {
      amount: new BigNumber(1000),
      recipient: "recipient",
    };
    const updatedTransaction = {
      amount: new BigNumber(2000),
      recipient: "recipient",
    };
    const patch = { feesStrategy: "custom" };
    const transitionTo = jest.fn();
    const updateTransaction = jest.fn((updater: (tx: typeof transaction) => typeof transaction) =>
      updater(transaction),
    );
    const getPatch = jest.fn().mockResolvedValue(patch);
    const bridgeUpdateTransaction = jest.fn().mockReturnValue(updatedTransaction);

    (getMainAccount as jest.Mock).mockReturnValue(account);
    (getAccountBridge as jest.Mock).mockReturnValue({
      updateTransaction: bridgeUpdateTransaction,
    });

    const { result } = renderHook(() =>
      useStepMethodContinue({
        editType: "speedup",
        account,
        parentAccount: undefined,
        transactionToUpdate: transaction,
        updateTransaction,
        transitionTo,
        getPatch,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(getPatch).toHaveBeenCalledWith({
      account,
      transaction,
      editType: "speedup",
    });
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(bridgeUpdateTransaction).toHaveBeenCalledWith(transaction, patch);
    expect(transitionTo).toHaveBeenCalledWith("summary");
  });

  it("throws when editType is missing", async () => {
    const transaction = {
      amount: new BigNumber(1000),
      recipient: "recipient",
    };
    const { result } = renderHook(() =>
      useStepMethodContinue({
        editType: undefined,
        account,
        parentAccount: undefined,
        transactionToUpdate: transaction,
        updateTransaction: jest.fn(),
        transitionTo: jest.fn(),
        getPatch: jest.fn(),
      }),
    );

    await expect(result.current()).rejects.toThrow("editType required");
  });
});
