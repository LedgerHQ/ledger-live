import {
  clearFeeOverridesPatch,
  buildPresetEstimationPatch,
  getFeesStrategyForPreset,
} from "../feeEstimation";

describe("clearFeeOverridesPatch", () => {
  it("clears every fee-override field to undefined without touching the fee-paying asset", () => {
    const patch = clearFeeOverridesPatch();

    expect(patch).toEqual({
      customGasLimit: undefined,
      gasPrice: undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      feePerByte: undefined,
      customFeeRate: undefined,
      fees: undefined,
      customFees: undefined,
    });
    expect(patch).not.toHaveProperty("feeCurrency");
  });
});

describe("buildPresetEstimationPatch", () => {
  it("clears the fee overrides for a non-custom preset", () => {
    const patch = buildPresetEstimationPatch("medium");
    expect(patch).toEqual({ feesStrategy: "medium", ...clearFeeOverridesPatch() });
  });

  it("keeps user overrides for the custom strategy", () => {
    const patch = buildPresetEstimationPatch("custom");
    expect(patch).toEqual({ feesStrategy: "custom" });
  });

  it("does not clear overrides when there is no strategy", () => {
    const patch = buildPresetEstimationPatch(undefined);
    expect(patch).toEqual({ feesStrategy: undefined });
  });
});

describe("getFeesStrategyForPreset", () => {
  it("maps known preset ids and rejects unknown ones", () => {
    expect(getFeesStrategyForPreset("slow")).toBe("slow");
    expect(getFeesStrategyForPreset("medium")).toBe("medium");
    expect(getFeesStrategyForPreset("fast")).toBe("fast");
    expect(getFeesStrategyForPreset("custom")).toBe("custom");
    expect(getFeesStrategyForPreset("bogus")).toBeNull();
  });
});
