/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/dom-polyfill";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook, waitFor } from "@testing-library/react";
import { genAccount } from "../mock/account";
import { getAccountBridge } from ".";
import useBridgeTransaction, {
  setGlobalOnBridgeError,
  getGlobalOnBridgeError,
} from "./useBridgeTransaction";
import { setSupportedCurrencies } from "../currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { shouldSyncBeforeTx } from "./useBridgeTransaction";

const BTC = getCryptoCurrencyById("bitcoin");

setSupportedCurrencies(["bitcoin"]);

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

describe("useBridgeTransaction", () => {
  test("initialize with a BTC account settles the transaction", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })));

    await waitFor(
      () => {
        expect(result.current.bridgePending).toBeFalsy();
        expect(result.current.bridgeError).toBeFalsy();
        expect(result.current.transaction).not.toBeFalsy();
        expect(result.current.account).not.toBeFalsy();
      },
      { timeout: 10000 },
    );
  });

  test("bridgeError go through", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result } = renderHook(() =>
      useBridgeTransaction(() => {
        const bridge = getAccountBridge(mainAccount);
        const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
          recipient: "criticalcrash",
        });
        return { account: mainAccount, transaction };
      }),
    );
    await waitFor(() => expect(result.current.bridgeError).not.toBeFalsy());
  });

  test("bridgeError can be caught with globalOnBridgeError", async () => {
    const before = getGlobalOnBridgeError();
    try {
      const errors: Array<any> = [];
      setGlobalOnBridgeError(error => errors.push(error));
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      renderHook(() =>
        useBridgeTransaction(() => {
          const bridge = getAccountBridge(mainAccount);
          const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
            recipient: "criticalcrash",
          });
          return { account: mainAccount, transaction };
        }),
      );

      await waitFor(() => expect(errors.length).toBe(1));
      expect(errors[0]).toMatchObject(new Error("isInvalidRecipient_mock_criticalcrash"));
    } finally {
      setGlobalOnBridgeError(before);
    }
  });

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
});
