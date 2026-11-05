import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { createMockContext } from "../test/fixtures";
import { createApi } from ".";

describe("createApi", () => {
  const api = createApi();

  // The contract's shape is guaranteed by the type now that `notSupportedApi()` is spread in,
  // so what is worth asserting is the split: which methods Canton actually wires, and which
  // are framework stubs. The previous test listed every method name, which only restated that
  // the object was shaped like the contract.
  it("implements what Canton supports today", () => {
    expect(isNotSupportedStub(api.lastBlock)).toBe(false);
    expect(isNotSupportedStub(api.getBalance)).toBe(false);
    expect(isNotSupportedStub(api.listOperations)).toBe(false);
    expect(isNotSupportedStub(api.combine)).toBe(false);
    expect(isNotSupportedStub(api.validateAddress)).toBe(false);
    expect(isNotSupportedStub(api.craftTransactionData)).toBe(false);
    expect(isNotSupportedStub(api.getNextSequence)).toBe(false);
  });

  it("stubs the rest of the contract", () => {
    expect(isNotSupportedStub(api.craftTransaction)).toBe(true);
    expect(isNotSupportedStub(api.estimateFees)).toBe(true);
    expect(isNotSupportedStub(api.broadcast)).toBe(true);
    expect(isNotSupportedStub(api.getStakes)).toBe(true);
    expect(isNotSupportedStub(api.validateIntent)).toBe(true);
  });

  it("rejects balance options, since the gateway always returns every holding", async () => {
    await expect(api.getBalance(createMockContext(), "party", {})).rejects.toThrow(
      InvalidParameterError,
    );
  });

  it("answers sequence 0 because Canton has no account nonce", async () => {
    await expect(api.getNextSequence(createMockContext(), "addr")).resolves.toBe(0n);
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
