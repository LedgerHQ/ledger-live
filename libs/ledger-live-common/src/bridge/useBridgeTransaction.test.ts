import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook } from "@testing-library/react-hooks";
import { genAccount } from "../mock/account";
import { getAccountBridge } from ".";
import useBridgeTransaction, {
  setGlobalOnBridgeError,
  getGlobalOnBridgeError,
} from "./useBridgeTransaction";

const BTC = getCryptoCurrencyById("bitcoin");

describe("useBridgeTransaction", () => {
  test("initialize with a BTC account settles the transaction", () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });

    const { result } = renderHook(() =>
      useBridgeTransaction(() => ({ account: mainAccount }))
    );

    expect(result.current.transaction).not.toBeFalsy();
  });

  test("bridgeError go through", () => {
    const mainAccount = genAccount("mocked-account-1", { currency: BTC });
    const { result } = renderHook(() =>
      useBridgeTransaction(() => {
        const bridge = getAccountBridge(mainAccount);
        const transaction = bridge.updateTransaction(
          bridge.createTransaction(mainAccount),
          { recipient: "criticalcrash" }
        );
        return { account: mainAccount, transaction };
      })
    );

    expect(result.current.bridgeError).not.toBeFalsy();
  });

  test("bridgeError can be caught with globalOnBridgeError", () => {
    const before = getGlobalOnBridgeError();
    try {
      const errors: Array<any> = [];
      setGlobalOnBridgeError((error) => errors.push(error));
      const mainAccount = genAccount("mocked-account-1", { currency: BTC });
      renderHook(() =>
        useBridgeTransaction(() => {
          const bridge = getAccountBridge(mainAccount);
          const transaction = bridge.updateTransaction(
            bridge.createTransaction(mainAccount),
            { recipient: "criticalcrash" }
          );
          return { account: mainAccount, transaction };
        })
      );

      expect(errors.length).toBe(1);
      expect(errors[0]).toMatchObject({
        name: "isInvalidRecipient_mock_criticalcrash",
      });
    } finally {
      setGlobalOnBridgeError(before);
    }
  });
});
