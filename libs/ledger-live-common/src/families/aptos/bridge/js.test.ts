import bridge from "./js";

describe("Aptos bridge interface ", () => {
  describe("currencyBridge ", () => {
    it("should contain all methods", () => {
      expect(bridge.currencyBridge.preload).toBeDefined();
      expect(typeof bridge.currencyBridge.preload).toBe("function");
      expect(bridge.currencyBridge.hydrate).toBeDefined();
      expect(typeof bridge.currencyBridge.hydrate).toBe("function");
      expect(bridge.currencyBridge.scanAccounts).toBeDefined();
      expect(typeof bridge.currencyBridge.scanAccounts).toBe("function");
    });
  });

  describe("accountBridge ", () => {
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
    });
  });
});
