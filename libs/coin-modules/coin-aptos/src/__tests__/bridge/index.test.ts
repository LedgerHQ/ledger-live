jest.mock("blockies-ts", () => ({
  create: jest.fn(() => ({
    toDataURL: () => "data:image/png;base64,fakebase64string",
  })),
}));
jest.mock("../../network/validators", () => ({
  getValidators: jest.fn(() => Promise.resolve([])),
}));

import BigNumber from "bignumber.js";
import { createBridges } from "../../bridge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

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
      expect(bridge.currencyBridge.hydrate).toBeDefined();
      expect(typeof bridge.currencyBridge.hydrate).toBe("function");
      const cryptoCurrency = getCryptoCurrencyById("aptos");
      const result = bridge.currencyBridge.hydrate({}, cryptoCurrency);
      expect(result).toBeUndefined();
    });

    it("should have a scanAccounts method that is a function", () => {
      expect(bridge.currencyBridge.scanAccounts).toBeDefined();
      expect(typeof bridge.currencyBridge.scanAccounts).toBe("function");
      const cryptoCurrency = getCryptoCurrencyById("aptos");
      const deviceId = "test-device";
      const result = bridge.currencyBridge.scanAccounts({
        currency: cryptoCurrency,
        deviceId,
        syncConfig: { paginationConfig: {} },
      });
      expect(result).toBeDefined();
    });
  });

  describe("accountBridge", () => {
    it("should contain all methods", () => {
      expect(bridge.accountBridge.estimateMaxSpendable).toBeDefined();
      expect(typeof bridge.accountBridge.estimateMaxSpendable).toBe("function");
      expect(bridge.accountBridge.createTransaction).toBeDefined();
      expect(typeof bridge.accountBridge.createTransaction).toBe("function");
      expect(bridge.accountBridge.updateTransaction).toBeDefined();
      expect(typeof bridge.accountBridge.updateTransaction).toBe("function");
      expect(bridge.accountBridge.getTransactionStatus).toBeDefined();
      expect(typeof bridge.accountBridge.getTransactionStatus).toBe("function");
      expect(bridge.accountBridge.prepareTransaction).toBeDefined();
      expect(typeof bridge.accountBridge.prepareTransaction).toBe("function");
      expect(bridge.accountBridge.sync).toBeDefined();
      expect(typeof bridge.accountBridge.sync).toBe("function");
      expect(bridge.accountBridge.receive).toBeDefined();
      expect(typeof bridge.accountBridge.receive).toBe("function");
      expect(bridge.accountBridge.signOperation).toBeDefined();
      expect(typeof bridge.accountBridge.signOperation).toBe("function");
      expect(bridge.accountBridge.broadcast).toBeDefined();
      expect(typeof bridge.accountBridge.broadcast).toBe("function");
      expect(bridge.currencyBridge.hydrate).toBeDefined();
      expect(typeof bridge.currencyBridge.hydrate).toBe("function");
      expect(bridge.currencyBridge.preload).toBeDefined();
      expect(typeof bridge.currencyBridge.preload).toBe("function");
      expect(bridge.currencyBridge.scanAccounts).toBeDefined();
      expect(typeof bridge.currencyBridge.scanAccounts).toBe("function");
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
