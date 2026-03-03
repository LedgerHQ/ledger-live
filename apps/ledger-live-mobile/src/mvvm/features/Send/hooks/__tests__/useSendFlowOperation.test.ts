import { renderHook, act } from "@tests/test-renderer";
import { useSendFlowOperation } from "../useSendFlowOperation";
import type { Operation } from "@ledgerhq/types-live";

const createMockOperation = (overrides?: Partial<Operation>): Operation =>
  ({
    id: "op-1",
    hash: "0xabc",
    type: "OUT",
    value: BigInt(0),
    fee: BigInt(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "account-1",
    date: new Date(),
    extra: {},
    ...overrides,
  }) as Operation;

describe("useSendFlowOperation (mobile)", () => {
  describe("initial state", () => {
    it("returns null optimisticOperation, null transactionError and signed false", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      expect(result.current.state).toEqual({
        optimisticOperation: null,
        transactionError: null,
        signed: false,
      });
    });

    it("exposes all required action callbacks", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      expect(typeof result.current.actions.onOperationBroadcasted).toBe("function");
      expect(typeof result.current.actions.onTransactionError).toBe("function");
      expect(typeof result.current.actions.onSigned).toBe("function");
      expect(typeof result.current.actions.onRetry).toBe("function");
    });
  });

  describe("onOperationBroadcasted", () => {
    it("should set optimisticOperation, clear error and set signed to true", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      const operation = createMockOperation();

      act(() => {
        result.current.actions.onOperationBroadcasted(operation);
      });

      expect(result.current.state).toEqual({
        optimisticOperation: operation,
        transactionError: null,
        signed: true,
      });
    });
  });

  describe("onTransactionError", () => {
    it("should set transactionError and set signed to false", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      const error = new Error("Broadcast failed");

      act(() => {
        result.current.actions.onTransactionError(error);
      });

      expect(result.current.state).toEqual({
        optimisticOperation: null,
        transactionError: error,
        signed: false,
      });
    });
  });

  describe("onSigned", () => {
    it("should set signed to true", () => {
      const { result } = renderHook(() => useSendFlowOperation());

      act(() => {
        result.current.actions.onSigned();
      });

      expect(result.current.state).toEqual({
        optimisticOperation: null,
        transactionError: null,
        signed: true,
      });
    });
  });

  describe("onRetry", () => {
    it("should reset operation state to initial values", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      const operation = createMockOperation();

      act(() => {
        result.current.actions.onOperationBroadcasted(operation);
      });
      act(() => {
        result.current.actions.onRetry();
      });

      expect(result.current.state).toEqual({
        optimisticOperation: null,
        transactionError: null,
        signed: false,
      });
    });

    it("should clear error and signed when retrying after error", () => {
      const { result } = renderHook(() => useSendFlowOperation());
      const error = new Error("Broadcast failed");

      act(() => {
        result.current.actions.onTransactionError(error);
      });
      act(() => {
        result.current.actions.onRetry();
      });

      expect(result.current.state).toEqual({
        optimisticOperation: null,
        transactionError: null,
        signed: false,
      });
    });
  });

  describe("actions stability", () => {
    it("actions object reference is stable across renders", () => {
      const { result, rerender } = renderHook(() => useSendFlowOperation());
      const actions1 = result.current.actions;
      rerender({});
      expect(result.current.actions).toBe(actions1);
    });
  });
});
