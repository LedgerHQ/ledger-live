/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook, waitFor, act } from "@testing-library/react";
import { genAccount } from "../mock/account";
import { getAccountBridge } from ".";
import useBridgeTransaction, {
  setGlobalOnBridgeError,
  getGlobalOnBridgeError,
  shouldSyncBeforeTx,
} from "./useBridgeTransaction";
import { setSupportedCurrencies } from "../currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@ledgerhq/live-env";

const BTC = getCryptoCurrencyById("bitcoin");

setSupportedCurrencies(["bitcoin"]);
setEnv("MOCK", "1");

LiveConfig.setConfig({
  config_currency_bitcoin: {
    type: "object",
    default: {
      checkSanctionedAddress: false,
    },
  },
});

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    getValueByKey: jest.fn(),
    setConfig: jest.fn(),
  },
}));

// Prevent real network calls from bitcoin's prepareTransaction (getFeeItems).
jest.mock("../families/bitcoin/bridge/api", () => ({
  getFeeItems: jest.fn().mockResolvedValue({ items: [], defaultFeePerByte: null }),
}));

const suspenseWrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Suspense, { fallback: null }, children);

describe("useBridgeTransaction", () => {
  test("initialize with a BTC account settles the transaction", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    let result: ReturnType<typeof renderHook<ReturnType<typeof useBridgeTransaction>, void>>["result"];
    await act(async () => {
      ({ result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })), {
        wrapper: suspenseWrapper,
      }));
      // Four microtask ticks: two for makeInit awaits, two for React's Suspense wakeUp.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(
      () => {
        expect(result!.current.bridgePending).toBeFalsy();
        expect(result!.current.bridgeError).toBeFalsy();
        expect(result!.current.transaction).not.toBeFalsy();
        expect(result!.current.account).not.toBeFalsy();
      },
      { timeout: 10000 },
    );
  }, 30000);

  test("bridgeError go through", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    let result: ReturnType<typeof renderHook<ReturnType<typeof useBridgeTransaction>, void>>["result"];
    await act(async () => {
      ({ result } = renderHook(
        () =>
          useBridgeTransaction(() => {
            const bridge = getAccountBridge(mainAccount);
            const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
              recipient: "criticalcrash",
            });
            return { account: mainAccount, transaction };
          }),
        { wrapper: suspenseWrapper },
      ));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(result!.current.bridgeError).not.toBeFalsy(), { timeout: 10000 });
  }, 30000);

  test("bridgeError can be caught with globalOnBridgeError", async () => {
    const before = getGlobalOnBridgeError();
    try {
      const errors: Array<any> = [];
      setGlobalOnBridgeError(error => errors.push(error));
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      await act(async () => {
        renderHook(
          () =>
            useBridgeTransaction(() => {
              const bridge = getAccountBridge(mainAccount);
              const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
                recipient: "criticalcrash",
              });
              return { account: mainAccount, transaction };
            }),
          { wrapper: suspenseWrapper },
        );
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => expect(errors.length).toBe(1), { timeout: 10000 });
      expect(errors[0]).toMatchObject(new Error("isInvalidRecipient_mock_criticalcrash"));
    } finally {
      setGlobalOnBridgeError(before);
    }
  }, 30000);

  describe("shouldSyncBeforeTx", () => {
    const mockCurrency = { id: "btc" } as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("returns true when currency-specific config has syncBeforeTx = true", () => {
      (LiveConfig.getValueByKey as jest.Mock).mockImplementation((key: string) => {
        if (key === "config_currency_btc") return { syncBeforeTx: true };
        return null;
      });

      const result = shouldSyncBeforeTx(mockCurrency);
      expect(result).toBe(true);
      expect(LiveConfig.getValueByKey).toHaveBeenCalledWith("config_currency_btc");
      expect(LiveConfig.getValueByKey).toHaveBeenCalledWith("config_currency");
    });

    test("returns false when currency-specific config has syncBeforeTx = false", () => {
      (LiveConfig.getValueByKey as jest.Mock).mockImplementation((key: string) => {
        if (key === "config_currency_btc") return { syncBeforeTx: false };
        return null;
      });

      const result = shouldSyncBeforeTx(mockCurrency);
      expect(result).toBe(false);
    });

    test("returns true when shared config has syncBeforeTx = true and no currency-specific config", () => {
      (LiveConfig.getValueByKey as jest.Mock).mockImplementation((key: string) => {
        if (key === "config_currency") return { syncBeforeTx: true };
        return null;
      });

      const result = shouldSyncBeforeTx(mockCurrency);
      expect(result).toBe(true);
    });

    test("returns false when neither config has syncBeforeTx", () => {
      (LiveConfig.getValueByKey as jest.Mock).mockReturnValue({});
      const result = shouldSyncBeforeTx(mockCurrency);
      expect(result).toBe(false);
    });

    test("returns false when shared config has syncBeforeTx = false", () => {
      (LiveConfig.getValueByKey as jest.Mock).mockImplementation((key: string) => {
        if (key === "config_currency") return { syncBeforeTx: false };
        return null;
      });

      const result = shouldSyncBeforeTx(mockCurrency);
      expect(result).toBe(false);
    });
  });

  describe("updateAccount", () => {
    test("updates account reference without resetting the transaction", async () => {
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      let result: ReturnType<typeof renderHook<ReturnType<typeof useBridgeTransaction>, void>>["result"];
      await act(async () => {
        ({ result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })), {
          wrapper: suspenseWrapper,
        }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => expect(result!.current.transaction).not.toBeFalsy(), { timeout: 10000 });

      const transactionBefore = result!.current.transaction;

      const updatedAccount = { ...mainAccount, blockHeight: (mainAccount.blockHeight ?? 0) + 1 };
      act(() => {
        result!.current.updateAccount(updatedAccount);
      });

      expect(result!.current.account).toBe(updatedAccount);
      expect(result!.current.account).not.toBe(mainAccount);
      // transaction must not be reset
      expect(result!.current.transaction).toBe(transactionBefore);
    }, 30000);

    test("is a no-op when the account id does not match", async () => {
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      let result: ReturnType<typeof renderHook<ReturnType<typeof useBridgeTransaction>, void>>["result"];
      await act(async () => {
        ({ result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })), {
          wrapper: suspenseWrapper,
        }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => expect(result!.current.account).not.toBeFalsy(), { timeout: 10000 });

      const differentAccount = genAccount("mocked-account-2", { currency: BTC });
      act(() => {
        result!.current.updateAccount(differentAccount);
      });

      expect(result!.current.account).toBe(mainAccount);
    }, 30000);

    test("is a no-op when the account reference is identical", async () => {
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      let result: ReturnType<typeof renderHook<ReturnType<typeof useBridgeTransaction>, void>>["result"];
      await act(async () => {
        ({ result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })), {
          wrapper: suspenseWrapper,
        }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => expect(result!.current.account).not.toBeFalsy(), { timeout: 10000 });

      const accountBefore = result!.current.account;
      act(() => {
        result!.current.updateAccount(mainAccount);
      });

      expect(result!.current.account).toBe(accountBefore);
    }, 30000);
  });
});
