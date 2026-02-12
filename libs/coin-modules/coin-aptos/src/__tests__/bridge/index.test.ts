jest.mock("../../network/validators", () => ({
  getValidators: jest.fn(() => Promise.resolve([])),
}));

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createBridges } from "../../bridge";

const signer = jest.fn();
const bridge = createBridges(signer);

describe("Aptos bridge interface ", () => {
  describe("currencyBridge", () => {
    it("should have a preload method that returns a promise", async () => {
      const cryptoCurrency = getCryptoCurrencyById("aptos");
      const result = bridge.currencyBridge.preload(cryptoCurrency);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toMatchObject({ validatorsWithMeta: [] });
    });

    it("should have a hydrate method that is a function", () => {
      expect(bridge.currencyBridge.hydrate).toBeInstanceOf(Function);
      const cryptoCurrency = getCryptoCurrencyById("aptos");
      const result = bridge.currencyBridge.hydrate({}, cryptoCurrency);
      expect(result).toBeUndefined();
    });

    it("should have a scanAccounts method that is a function", () => {
      expect(bridge.currencyBridge.scanAccounts).toBeInstanceOf(Function);
      const cryptoCurrency = getCryptoCurrencyById("aptos");
      const deviceId = "test-device";
      const result = bridge.currencyBridge.scanAccounts({
        currency: cryptoCurrency,
        deviceId,
        syncConfig: { paginationConfig: {} },
      });
      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe("accountBridge", () => {
    it("should contain all methods", () => {
      expect(bridge).toEqual({
        accountBridge: {
          estimateMaxSpendable: expect.any(Function),
          createTransaction: expect.any(Function),
          updateTransaction: expect.any(Function),
          getTransactionStatus: expect.any(Function),
          prepareTransaction: expect.any(Function),
          sync: expect.any(Function),
          receive: expect.any(Function),
          signOperation: expect.any(Function),
          broadcast: expect.any(Function),
          assignFromAccountRaw: expect.any(Function),
          assignToAccountRaw: expect.any(Function),
          getSerializedAddressParameters: expect.any(Function),
          signRawOperation: expect.any(Function),
          validateAddress: expect.any(Function),
        },
        currencyBridge: {
          hydrate: expect.any(Function),
          preload: expect.any(Function),
          scanAccounts: expect.any(Function),
        },
      });
    });
  });

  describe("updateTransaction", () => {
    it("should update the transaction with the given patch", () => {
      const initialTransaction = {
        amount: new BigNumber(100),
        recipient: "address1",
        mode: "send",
        family: "aptos" as const,
        options: { maxGasAmount: "", gasUnitPrice: "" },
      };
      const patch = { amount: new BigNumber(200) };
      const updatedTransaction = bridge.accountBridge.updateTransaction(initialTransaction, patch);
      expect(updatedTransaction).toEqual({
        amount: new BigNumber(200),
        recipient: "address1",
        mode: "send",
        family: "aptos" as const,
        options: { maxGasAmount: "", gasUnitPrice: "" },
      });
    });

    it("should not modify the original transaction object", () => {
      const initialTransaction = {
        amount: new BigNumber(100),
        recipient: "address1",
        mode: "send",
        family: "aptos" as const,
        options: { maxGasAmount: "", gasUnitPrice: "" },
      };
      const patch = { amount: new BigNumber(200) };
      const updatedTransaction = bridge.accountBridge.updateTransaction(initialTransaction, patch);
      expect(initialTransaction).toEqual({
        amount: new BigNumber(100),
        recipient: "address1",
        mode: "send",
        family: "aptos" as const,
        options: { maxGasAmount: "", gasUnitPrice: "" },
      });
      expect(updatedTransaction).not.toBe(initialTransaction);
    });
  });
});
