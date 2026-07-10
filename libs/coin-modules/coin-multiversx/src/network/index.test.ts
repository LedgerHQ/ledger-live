import * as network from "./index";

// The barrel re-exports the new network client plus the legacy bridge-path SDK
// functions that bridge files import from "./network".
describe("network barrel", () => {
  it("re-exports the network client factory and class", () => {
    expect(typeof network.createNetworkApi).toBe("function");
    expect(typeof network.MultiversXNetworkApi).toBe("function");
  });

  it("re-exports the legacy bridge SDK functions", () => {
    for (const fn of [
      "getAccount",
      "getNetworkConfig",
      "getProviders",
      "getEGLDOperations",
      "getFees",
      "broadcastTransaction",
      "getAccountESDTTokens",
      "getAccountDelegations",
      "getESDTOperations",
      "hasESDTTokens",
      "getAccountNonce",
    ]) {
      expect(typeof (network as Record<string, unknown>)[fn]).toBe("function");
    }
  });
});
