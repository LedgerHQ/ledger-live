import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook } from "@testing-library/react-hooks";
import { genAccount } from "../mock/account";
import { getAccountBridge } from ".";
import useBridgeTransaction, {
  setGlobalOnBridgeError,
  getGlobalOnBridgeError,
} from "./useBridgeTransaction";
import { setSupportedCurrencies } from "../currencies";

const BTC = getCryptoCurrencyById("bitcoin");

setSupportedCurrencies(["bitcoin"]);

describe("useBridgeTransaction", () => {
  test("initialize with a BTC account settles the transaction", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result, waitForNextUpdate } = renderHook(() =>
      useBridgeTransaction(() => ({ account: mainAccount })),
    );
    await waitForNextUpdate();
    expect(result.current.bridgePending).toBeFalsy();
    expect(result.current.bridgeError).toBeFalsy();
    expect(result.current.transaction).not.toBeFalsy();
    expect(result.current.account).not.toBeFalsy();
  });

  test("bridgeError go through", async () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result, waitForNextUpdate } = renderHook(() =>
      useBridgeTransaction(() => {
        const bridge = getAccountBridge(mainAccount);
        const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
          recipient: "criticalcrash",
        });
        return { account: mainAccount, transaction };
      }),
    );
    await waitForNextUpdate();
    expect(result.current.bridgeError).not.toBeFalsy();
  });

  test("bridgeError can be caught with globalOnBridgeError", async () => {
    const before = getGlobalOnBridgeError();
    try {
      const errors: Array<any> = [];
      setGlobalOnBridgeError(error => errors.push(error));
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      const { waitForNextUpdate } = renderHook(() =>
        useBridgeTransaction(() => {
          const bridge = getAccountBridge(mainAccount);
          const transaction = bridge.updateTransaction(bridge.createTransaction(mainAccount), {
            recipient: "criticalcrash",
          });
          return { account: mainAccount, transaction };
        }),
      );
      await waitForNextUpdate();

      expect(errors.length).toBe(1);
      expect(errors[0]).toMatchObject(new Error("isInvalidRecipient_mock_criticalcrash"));
    } finally {
      setGlobalOnBridgeError(before);
    }
  });
});
