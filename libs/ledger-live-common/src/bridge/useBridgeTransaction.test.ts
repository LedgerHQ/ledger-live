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

describe("useBridgeTransaction", () => {
  test("initialize with a BTC account settles the transaction", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result } = renderHook(() => useBridgeTransaction(() => ({ account: mainAccount })));

    await waitFor(() => {
      expect(result.current.bridgePending).toBeFalsy();
      expect(result.current.bridgeError).toBeFalsy();
      expect(result.current.transaction).not.toBeFalsy();
      expect(result.current.account).not.toBeFalsy();
    });
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
});
