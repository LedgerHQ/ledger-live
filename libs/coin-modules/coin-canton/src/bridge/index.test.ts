import { createMockCoinConfig, createMockSignerContext } from "../test/fixtures";
import { createBridges } from ".";

describe("createBridges", () => {
  const mockSignerContext = createMockSignerContext();
  const mockCoinConfig = createMockCoinConfig();

  it("should return both bridges interface", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.accountBridge).not.toBeNull();
    expect(bridges.currencyBridge).not.toBeNull();
  });

  it("should have a currency bridge with required methods", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.currencyBridge).not.toBeNull();
    expect(bridges.currencyBridge.preload).not.toBeNull();
    expect(bridges.currencyBridge.hydrate).not.toBeNull();
    expect(bridges.currencyBridge.scanAccounts).not.toBeNull();
  });

  it("should have an account bridge with required methods", () => {
    const bridges = createBridges(mockSignerContext, mockCoinConfig);
    expect(bridges.accountBridge).not.toBeNull();
    expect(bridges.accountBridge.broadcast).not.toBeNull();
    expect(bridges.accountBridge.createTransaction).not.toBeNull();
    expect(bridges.accountBridge.estimateMaxSpendable).not.toBeNull();
    expect(bridges.accountBridge.getTransactionStatus).not.toBeNull();
    expect(bridges.accountBridge.prepareTransaction).not.toBeNull();
    expect(bridges.accountBridge.receive).not.toBeNull();
    expect(bridges.accountBridge.signOperation).not.toBeNull();
    expect(bridges.accountBridge.sync).not.toBeNull();
    expect(bridges.accountBridge.updateTransaction).not.toBeNull();
  });
});
