/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { SendFlowOperationActions, SendFlowTransactionActions } from "../../types";
import { useSendFlowBusinessLogic } from "../useSendFlowBusinessLogic";
import { getSendUiConfig } from "../../uiConfig";
import type { TransactionStatus } from "../../../../coin-modules/transaction-types";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";

jest.mock("../../uiConfig", () => ({
  getSendUiConfig: jest.fn(),
}));

jest.mock("../../../../bridge/descriptor/send/features", () => {
  const actual = jest.requireActual("../../../../bridge/descriptor/send/features");
  return {
    ...actual,
    sendFeatures: { ...actual.sendFeatures, hasMemoForRecipient: jest.fn() },
  };
});

const mockGetSendUiConfig = jest.mocked(getSendUiConfig);
const mockHasMemoForRecipient = jest.mocked(sendFeatures.hasMemoForRecipient);

const transactionActions: SendFlowTransactionActions = {
  setTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  setRecipient: jest.fn(),
  setAccount: jest.fn(),
  updateAccount: jest.fn(),
};

const operationActions: SendFlowOperationActions = {
  onOperationBroadcasted: jest.fn(),
  onTransactionError: jest.fn(),
  onSigned: jest.fn(),
  onRetry: jest.fn(),
};

const useTransactionHook = () => ({
  state: {
    transaction: null,
    status: {} as never,
    bridgeError: null,
    bridgePending: false,
  },
  actions: transactionActions,
});

const useOperationHook = () => ({
  state: {
    optimisticOperation: null,
    transactionError: null,
    signed: false,
  },
  actions: operationActions,
});

describe("useSendFlowBusinessLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSendUiConfig.mockReturnValue({ hasMemo: false } as ReturnType<typeof getSendUiConfig>);
    mockHasMemoForRecipient.mockReturnValue(true);
  });

  it("should prefill recipient search without accepting the recipient before validation", () => {
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(() =>
      useSendFlowBusinessLogic({
        initParams: { recipient },
        useTransactionHook,
        useOperationHook,
      }),
    );

    expect(result.current.recipientSearch.value).toBe(recipient);
    expect(result.current.state.recipient).toBeNull();
    expect(transactionActions.setRecipient).not.toHaveBeenCalled();
  });

  it("should accept a direct recipient when instructed to skip recipient selection", async () => {
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    let hasTransaction = false;
    const useTransactionHookWithTransaction = () => ({
      state: {
        transaction: hasTransaction ? ({} as never) : null,
        status: {} as never,
        bridgeError: null,
        bridgePending: false,
      },
      actions: transactionActions,
    });
    const { result, rerender } = renderHook(() =>
      useSendFlowBusinessLogic({
        initParams: { recipient, skipRecipientStep: true },
        useTransactionHook: useTransactionHookWithTransaction,
        useOperationHook,
      }),
    );

    expect(result.current.state.recipient).toBeNull();
    expect(transactionActions.setRecipient).not.toHaveBeenCalled();

    hasTransaction = true;
    rerender();

    await waitFor(() => {
      expect(result.current.state.recipient).toEqual({ address: recipient });
    });
    expect(result.current.isRecipientAddressComplete).toBe(true);
    expect(transactionActions.setRecipient).toHaveBeenCalledWith({ address: recipient });
  });

  it("should not accept an empty direct recipient", async () => {
    const useTransactionHookWithTransaction = () => ({
      state: {
        transaction: {} as never,
        status: {} as never,
        bridgeError: null,
        bridgePending: false,
      },
      actions: transactionActions,
    });
    const { result } = renderHook(() =>
      useSendFlowBusinessLogic({
        initParams: { recipient: "   ", skipRecipientStep: true },
        useTransactionHook: useTransactionHookWithTransaction,
        useOperationHook,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.recipient).toBeNull();
    });
    expect(result.current.isRecipientAddressComplete).toBe(false);
    expect(transactionActions.setRecipient).not.toHaveBeenCalled();
  });

  it("should keep a direct recipient unaccepted when its currency requires a memo", async () => {
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const useTransactionHookWithTransaction = () => ({
      state: {
        transaction: {} as never,
        status: {} as never,
        bridgeError: null,
        bridgePending: false,
      },
      actions: transactionActions,
    });
    mockGetSendUiConfig.mockReturnValue({ hasMemo: true } as ReturnType<typeof getSendUiConfig>);

    const { result } = renderHook(() =>
      useSendFlowBusinessLogic({
        initParams: { recipient, skipRecipientStep: true },
        useTransactionHook: useTransactionHookWithTransaction,
        useOperationHook,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.recipient).toBeNull();
    });
    expect(result.current.isRecipientAddressComplete).toBe(false);
    expect(transactionActions.setRecipient).not.toHaveBeenCalled();
  });

  it("should clear recipient search and transaction recipient when reset", () => {
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(() =>
      useSendFlowBusinessLogic({
        initParams: { recipient },
        useTransactionHook,
        useOperationHook,
      }),
    );

    act(() => {
      result.current.transaction.setRecipient({
        address: recipient,
        displayLabel: "Private balance",
      });
      result.current.recipientSearch.setValue(recipient);
      result.current.setIsRecipientAddressComplete(true);
    });

    act(() => {
      result.current.resetRecipient();
    });

    expect(result.current.state.recipient).toBeNull();
    expect(result.current.recipientSearch.value).toBe("");
    expect(result.current.isRecipientAddressComplete).toBe(false);
    expect(transactionActions.setRecipient).toHaveBeenCalledWith({ address: "" });
  });

  describe("memo length", () => {
    const RECIPIENT = "recipient-address";
    const amountError = new Error("amount");
    const bridgeStatus = {
      errors: { amount: amountError },
      warnings: {},
      estimatedFees: null,
      amount: null,
      totalSpent: null,
    } as unknown as TransactionStatus;
    const useTransactionHookWithStatus = () => ({
      state: {
        transaction: null,
        status: bridgeStatus,
        bridgeError: null,
        bridgePending: false,
      },
      actions: transactionActions,
    });

    function renderWithMemoConfig(config: Partial<ReturnType<typeof getSendUiConfig>>) {
      mockGetSendUiConfig.mockReturnValue({
        hasMemo: true,
        ...config,
      } as ReturnType<typeof getSendUiConfig>);
      return renderHook(() =>
        useSendFlowBusinessLogic({
          useTransactionHook: useTransactionHookWithStatus,
          useOperationHook,
        }),
      );
    }

    it("should keep a memo longer than the descriptor limit whole and report it as a transaction error", () => {
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({
          address: RECIPIENT,
          memo: { value: "abcdefghij" },
        });
      });

      expect(result.current.state.recipient?.memo?.value).toBe("abcdefghij");
      expect(result.current.state.transaction.status.errors.transaction).toMatchObject({
        name: "MemoTooLong",
        memoLength: 10,
        maxLength: 5,
      });
      expect(result.current.state.transaction.status.errors.amount).toBe(amountError);
    });

    it("should withhold an over-limit memo from the bridge so fee estimation never sends it", () => {
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({
          address: RECIPIENT,
          memo: { value: "abcdefghij" },
        });
      });

      expect(transactionActions.setRecipient).toHaveBeenLastCalledWith({
        address: RECIPIENT,
        memo: { value: "" },
      });
    });

    it("should pass a memo within the limit to the bridge", () => {
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({ address: RECIPIENT, memo: { value: "abcde" } });
      });

      expect(transactionActions.setRecipient).toHaveBeenLastCalledWith({
        address: RECIPIENT,
        memo: { value: "abcde" },
      });
    });

    it("should ignore the memo limit when the recipient cannot carry a memo", () => {
      mockHasMemoForRecipient.mockReturnValue(false);
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({
          address: RECIPIENT,
          memo: { value: "abcdefghij" },
        });
      });

      expect(result.current.state.transaction.status).toBe(bridgeStatus);
    });

    it("should leave the bridge status untouched for a memo at the descriptor limit", () => {
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({ address: RECIPIENT, memo: { value: "abcde" } });
      });

      expect(result.current.state.transaction.status).toBe(bridgeStatus);
    });

    it("should leave tag memos to their own numeric limit", () => {
      const { result } = renderWithMemoConfig({ memoType: "tag", memoMaxLength: 3 });

      act(() => {
        result.current.transaction.setRecipient({ address: RECIPIENT, memo: { value: "123456" } });
      });

      expect(result.current.state.transaction.status).toBe(bridgeStatus);
    });

    it("should clear the memo error once the memo is shortened to fit", () => {
      const { result } = renderWithMemoConfig({ memoType: "text", memoMaxLength: 5 });

      act(() => {
        result.current.transaction.setRecipient({
          address: RECIPIENT,
          memo: { value: "abcdefghij" },
        });
      });
      act(() => {
        result.current.transaction.setRecipient({ address: RECIPIENT, memo: { value: "abc" } });
      });

      expect(result.current.state.transaction.status).toBe(bridgeStatus);
    });
  });
});
