import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";

describe("createApi", () => {
  const api = createApi();

  // The contract's shape is guaranteed by the type now that `notSupportedApi()` is spread in,
  // so what is worth asserting is the split: which methods Canton actually wires, and which
  // are framework stubs. The previous test listed every method name, which only restated that
  // the object was shaped like the contract.
  it("implements what Canton supports today", () => {
    expect(isNotSupportedStub(api.combine)).toBe(false);
    expect(isNotSupportedStub(api.validateAddress)).toBe(false);
    expect(isNotSupportedStub(api.craftTransactionData)).toBe(false);
  });

  it("stubs the rest of the contract", () => {
    expect(isNotSupportedStub(api.lastBlock)).toBe(true);
    expect(isNotSupportedStub(api.getBalance)).toBe(true);
    expect(isNotSupportedStub(api.listOperations)).toBe(true);
    expect(isNotSupportedStub(api.craftTransaction)).toBe(true);
    expect(isNotSupportedStub(api.estimateFees)).toBe(true);
    expect(isNotSupportedStub(api.broadcast)).toBe(true);
    expect(isNotSupportedStub(api.getStakes)).toBe(true);
    expect(isNotSupportedStub(api.validateIntent)).toBe(true);
  });

  // Absent account metadata is an answer, not a missing capability (ADR-045) — the same value
  // `withDefaults` supplied before, now carried by the module itself.
  it("answers the sentinel for getAccountInfo rather than throwing", async () => {
    await expect(
      api.getAccountInfo?.(
        { config: () => Promise.reject(new Error("stub")), logger: () => undefined },
        "addr",
      ),
    ).resolves.toEqual({ type: "none" });
  });
});
