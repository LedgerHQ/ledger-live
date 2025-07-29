import { renderHook, act } from "@tests/test-renderer";
import { AccountLike } from "@ledgerhq/types-live";
import { of } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useCallbackRegistry } from "../useCallbackRegistry";
import BigNumber from "bignumber.js";

const mockAccount = { id: "account1", name: "Test Account" } as unknown as AccountLike;
const mockParentAccount = {
  id: "parentAccount1",
  name: "Parent Account",
} as unknown as AccountLike;

const mockWalletAPIAccount: WalletAPIAccount = {
  id: "wallet-account-1",
  name: "Wallet API Account",
  address: "0x456",
  currency: "ethereum",
  balance: new BigNumber("2000000000000000000"),
  spendableBalance: new BigNumber("2000000000000000000"),
  blockHeight: 100,
  lastSyncDate: new Date(),
};

describe("useCallbackRegistry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("callback registry", () => {
    it("should register, execute and auto-unregister callbacks", () => {
      const { result } = renderHook(() => useCallbackRegistry());
      const mockCallback = jest.fn();

      act(() => {
        result.current.registerCallback("test", mockCallback);
      });

      expect(result.current.getCallback("test")).toBe(mockCallback);

      act(() => {
        result.current.executeCallback("test", mockAccount, mockParentAccount);
      });

      expect(mockCallback).toHaveBeenCalledWith(mockAccount, mockParentAccount);
      expect(result.current.getCallback("test")).toBeUndefined();
    });

    it("should handle non-existent callbacks", () => {
      const { result } = renderHook(() => useCallbackRegistry());

      expect(result.current.getCallback("missing")).toBeUndefined();
      expect(() => {
        act(() => result.current.executeCallback("missing", mockAccount));
      }).not.toThrow();
    });

    it("should manually unregister callbacks", () => {
      const { result } = renderHook(() => useCallbackRegistry());
      const mockCallback = jest.fn();

      act(() => {
        result.current.registerCallback("test", mockCallback);
        result.current.unregisterCallback("test");
      });

      expect(result.current.getCallback("test")).toBeUndefined();
    });
  });

  describe("observable registry", () => {
    it("should register and unregister observables", () => {
      const { result } = renderHook(() => useCallbackRegistry());
      const mockObservable = of([mockWalletAPIAccount]);

      act(() => {
        result.current.registerObservable("test", mockObservable);
      });

      expect(result.current.getObservable("test")).toBe(mockObservable);

      act(() => {
        result.current.unregisterObservable("test");
      });

      expect(result.current.getObservable("test")).toBeUndefined();
    });
  });

  describe("persistence", () => {
    it("should persist across re-renders and multiple instances", () => {
      const mockCallback = jest.fn();
      const mockObservable = of([mockWalletAPIAccount]);

      const { result: result1 } = renderHook(() => useCallbackRegistry());
      const { result: result2 } = renderHook(() => useCallbackRegistry());

      act(() => {
        result1.current.registerCallback("callback", mockCallback);
        result1.current.registerObservable("observable", mockObservable);
      });

      // Should be accessible from both instances
      expect(result2.current.getCallback("callback")).toBe(mockCallback);
      expect(result2.current.getObservable("observable")).toBe(mockObservable);
    });
  });
});
