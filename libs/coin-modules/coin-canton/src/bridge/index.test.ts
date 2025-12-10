import { createMockCoinConfig, createMockSignerContext } from "../test/fixtures";
import { createBridges } from ".";

describe("createBridges", () => {
  const mockSignerContext = createMockSignerContext();
  const mockCoinConfig = createMockCoinConfig();

  it("should return both bridges interface", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.accountBridge).toBeDefined();
    expect(bridges.currencyBridge).toBeDefined();
  });

  it("should have a currency bridge with required methods", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.currencyBridge).toBeDefined();
    expect(bridges.currencyBridge.preload).toBeDefined();
    expect(bridges.currencyBridge.hydrate).toBeDefined();
    expect(bridges.currencyBridge.scanAccounts).toBeDefined();
  });

  it("should have an account bridge with required methods", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.accountBridge).toBeDefined();
    expect(bridges.accountBridge.broadcast).toBeDefined();
    expect(bridges.accountBridge.createTransaction).toBeDefined();
    expect(bridges.accountBridge.estimateMaxSpendable).toBeDefined();
    expect(bridges.accountBridge.getTransactionStatus).toBeDefined();
    expect(bridges.accountBridge.prepareTransaction).toBeDefined();
    expect(bridges.accountBridge.receive).toBeDefined();
    expect(bridges.accountBridge.signOperation).toBeDefined();
    expect(bridges.accountBridge.sync).toBeDefined();
    expect(bridges.accountBridge.updateTransaction).toBeDefined();
  });
});
