/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook, waitFor } from "@testing-library/react";
import type { SendFlowOperationActions, SendFlowTransactionActions } from "../../types";
import { useSendFlowBusinessLogic } from "../useSendFlowBusinessLogic";

const transactionActions: SendFlowTransactionActions = {
  setTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  setRecipient: jest.fn(),
  setAccount: jest.fn(),
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
});
