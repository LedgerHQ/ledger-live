/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import { FLOW_STATUS } from "../../../wizard/types";
import type { SendFlowOperationResult } from "../../types";
import { useSendFlowConfirmationCore } from "../useSendFlowConfirmationCore";

const bitcoin = getCryptoCurrencyById("bitcoin");

const mainOperation = { id: "main-op" } as Operation;
const subOperation = { id: "sub-op" } as Operation;

const operationResult = (
  overrides: Partial<SendFlowOperationResult> = {},
): SendFlowOperationResult => ({
  optimisticOperation: null,
  transactionError: null,
  signed: false,
  ...overrides,
});

describe("useSendFlowConfirmationCore", () => {
  it("derives the success status and exposes the optimistic operation", () => {
    const { result } = renderHook(() =>
      useSendFlowConfirmationCore({
        operation: operationResult({ signed: true, optimisticOperation: mainOperation }),
        currency: bitcoin,
        operationActions: { onRetry: jest.fn() },
        statusActions: { resetStatus: jest.fn() },
        navigateToSignature: jest.fn(),
      }),
    );

    expect(result.current.status).toBe(FLOW_STATUS.SUCCESS);
    expect(result.current.concernedOperation).toBe(mainOperation);
  });

  it("prefers the first sub-operation when present", () => {
    const { result } = renderHook(() =>
      useSendFlowConfirmationCore({
        operation: operationResult({
          signed: true,
          optimisticOperation: { ...mainOperation, subOperations: [subOperation] } as Operation,
        }),
        currency: bitcoin,
        operationActions: { onRetry: jest.fn() },
        statusActions: { resetStatus: jest.fn() },
        navigateToSignature: jest.fn(),
      }),
    );

    expect(result.current.concernedOperation).toBe(subOperation);
  });

  it("retries by resetting status and navigating back to signature", () => {
    const onRetry = jest.fn();
    const resetStatus = jest.fn();
    const navigateToSignature = jest.fn();

    const { result } = renderHook(() =>
      useSendFlowConfirmationCore({
        operation: operationResult({ transactionError: new Error("boom") }),
        currency: bitcoin,
        operationActions: { onRetry },
        statusActions: { resetStatus },
        navigateToSignature,
      }),
    );

    act(() => result.current.onRetry());

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(resetStatus).toHaveBeenCalledTimes(1);
    expect(navigateToSignature).toHaveBeenCalledTimes(1);
  });
});
