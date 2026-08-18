import * as nearBridge from "./api";

const { computeIntentType } = nearBridge;
const bridgeApi = nearBridge.default;

describe("generic-coin-framework NEAR bridge api", () => {
  describe("computeIntentType", () => {
    it.each(["send", "stake", "unstake"] as const)("returns '%s' unchanged", mode => {
      expect(computeIntentType({ mode })).toBe(mode);
    });

    it("maps NEAR's 'withdraw' onto the framework's 'finalize_unstake'", () => {
      expect(computeIntentType({ mode: "withdraw" })).toBe("finalize_unstake");
    });

    it.each([{}, { mode: undefined }, { mode: null }])(
      "falls back to 'send' when mode is absent (%p)",
      transaction => {
        expect(computeIntentType(transaction)).toBe("send");
      },
    );

    it("throws for an unsupported string mode", () => {
      expect(() => computeIntentType({ mode: "changeTrust" })).toThrow(
        "Unsupported transaction mode: changeTrust",
      );
    });

    it("throws a TypeError when mode is a non-string value", () => {
      expect(() => computeIntentType({ mode: 42 })).toThrow(TypeError);
      expect(() => computeIntentType({ mode: 42 })).toThrow("Unsupported transaction mode: 42");
    });

    it("reports an object mode without collapsing it to [object Object]", () => {
      expect(() => computeIntentType({ mode: { kind: "stake" } })).toThrow(
        'Unsupported transaction mode: {"kind":"stake"}',
      );
    });
  });

  describe("default export", () => {
    it("declares staking support", () => {
      expect(bridgeApi.stakingSupported).toBe(true);
    });

    it("wires computeIntentType so the framework picks it up over its own whitelist", () => {
      expect(bridgeApi.computeIntentType).toBe(computeIntentType);
      expect(bridgeApi.computeIntentType?.({ mode: "withdraw" })).toBe("finalize_unstake");
    });
  });
});
