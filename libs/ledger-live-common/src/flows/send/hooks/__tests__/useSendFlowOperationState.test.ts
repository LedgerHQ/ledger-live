/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useSendFlowOperationState } from "../useSendFlowOperationState";

describe("useSendFlowOperationState", () => {
  it("should keep signed to true when the broadcast fails after signing", () => {
    const { result } = renderHook(() => useSendFlowOperationState());
    const error = new Error("Broadcast failed");

    act(() => {
      result.current.actions.dispatchSetSigned();
    });
    act(() => {
      result.current.actions.dispatchSetError(error);
    });

    expect(result.current.state).toEqual({
      optimisticOperation: null,
      transactionError: error,
      signed: true,
    });
  });

  it("should keep signed to false when the signature fails", () => {
    const { result } = renderHook(() => useSendFlowOperationState());
    const error = new Error("Signature failed");

    act(() => {
      result.current.actions.dispatchSetError(error);
    });

    expect(result.current.state).toEqual({
      optimisticOperation: null,
      transactionError: error,
      signed: false,
    });
  });
});
