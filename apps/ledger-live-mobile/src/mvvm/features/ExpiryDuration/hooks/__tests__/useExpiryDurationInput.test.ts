import { renderHook, act } from "@tests/test-renderer";
import { useExpiryDurationInput } from "../useExpiryDurationInput";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TxPatch } from "../../types";

// Mock the perFamily import
jest.mock("~/generated/ExpiryDurationInput", () => ({
  __esModule: true,
  default: {
    canton: () => null,
  },
}));

describe("useExpiryDurationInput", () => {
  const mockUpdateTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when family is not supported", () => {
    it("should return null for unsupported family", () => {
      const { result } = renderHook(() => useExpiryDurationInput("bitcoin", mockUpdateTransaction));

      expect(result.current).toBeNull();
    });
  });

  describe("when family is supported", () => {
    it("should return Input component and handlers", () => {
      const { result } = renderHook(() => useExpiryDurationInput("canton", mockUpdateTransaction));

      expect(result.current).not.toBeNull();
      expect(result.current?.Input).toBeDefined();
      expect(result.current?.handleChange).toBeDefined();
      expect(result.current?.value).toBeUndefined();
      expect(result.current?.error).toBeUndefined();
    });

    it("should update value when handleChange is called", () => {
      const { result } = renderHook(() => useExpiryDurationInput("canton", mockUpdateTransaction));

      const mockPatch: TxPatch<Transaction> = tx => ({ ...tx, expireInSeconds: 3600 });

      act(() => {
        result.current?.handleChange({ patch: mockPatch, value: 3600 });
      });

      expect(result.current?.value).toBe(3600);
      expect(result.current?.error).toBeUndefined();
      expect(mockUpdateTransaction).toHaveBeenCalledWith(mockPatch);
    });

    it("should update error when handleChange is called with error", () => {
      const { result } = renderHook(() => useExpiryDurationInput("canton", mockUpdateTransaction));

      const mockError = new Error("Test error");
      const mockPatch: TxPatch<Transaction> = tx => tx;

      act(() => {
        result.current?.handleChange({ patch: mockPatch, value: 0, error: mockError });
      });

      expect(result.current?.value).toBe(0);
      expect(result.current?.error).toBe(mockError);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(mockPatch);
    });

    it("should call updateTransaction with the patch function", () => {
      const { result } = renderHook(() => useExpiryDurationInput("canton", mockUpdateTransaction));

      const expireInSeconds = 24 * 60 * 60;
      const mockPatch: TxPatch<Transaction> = tx => ({
        ...tx,
        expireInSeconds,
      });

      act(() => {
        result.current?.handleChange({ patch: mockPatch, value: expireInSeconds });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.any(Function));

      // Verify the patch function works correctly
      const patchFn = mockUpdateTransaction.mock.calls[0][0];
      const mockTx = { family: "canton" } as Transaction;
      expect(patchFn(mockTx)).toEqual({ family: "canton", expireInSeconds });
    });

    it("should maintain stable handleChange reference when updateTransaction does not change", () => {
      const { result, rerender } = renderHook(() =>
        useExpiryDurationInput("canton", mockUpdateTransaction),
      );

      const initialHandleChange = result.current?.handleChange;

      rerender({});

      expect(result.current?.handleChange).toBe(initialHandleChange);
    });
  });
});
