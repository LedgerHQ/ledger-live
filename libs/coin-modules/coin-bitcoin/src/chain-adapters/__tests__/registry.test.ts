import { registerChainAdapter, getChainAdapter } from "../registry";
import { defaultAdapter } from "../default";
import type { ChainAdapter } from "../types";

describe("chain-adapters/registry", () => {
  it("getChainAdapter returns defaultAdapter for an unknown currency", () => {
    expect(getChainAdapter("bitcoin")).toBe(defaultAdapter);
  });

  it("getChainAdapter returns the registered adapter", () => {
    const mockAdapter: ChainAdapter = {
      id: "test-currency",
    };
    registerChainAdapter(mockAdapter);
    expect(getChainAdapter("test-currency")).toBe(mockAdapter);
  });

  it("defaultAdapter has no optional methods", () => {
    expect(defaultAdapter.buildExtraSyncObservable).toBeUndefined();
    expect(defaultAdapter.assignToAccountRaw).toBeUndefined();
    expect(defaultAdapter.assignFromAccountRaw).toBeUndefined();
    expect(defaultAdapter.signOperation).toBeUndefined();
    expect(defaultAdapter.getTransactionStatus).toBeUndefined();
    expect(defaultAdapter.estimateMaxSpendable).toBeUndefined();
    expect(defaultAdapter.prepareTransaction).toBeUndefined();
  });
});
