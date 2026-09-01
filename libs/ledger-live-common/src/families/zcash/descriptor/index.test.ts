import { descriptor } from "./index";

describe("zcash send descriptor", () => {
  it("declares nothing that replaces estimatedFees", () => {
    // ZIP-317 is the one conventional fee, computed by the bridge and surfaced
    // as `status.estimatedFees`; the descriptor must not intercept it with a
    // preset list, a custom-fee input, a default-strategy patch, or a
    // `getNetworkFeesInfo` override. That the surfaced figure is the computed
    // ZIP-317 fee rather than the 2-action floor is asserted where it is
    // resolved: coin-zcash's getTransactionStatus tests, "ZIP-317 fee surfaced
    // by the flow".
    expect(descriptor.send.fees.hasPresets).toBe(false);
    expect(descriptor.send.fees.hasCustom).toBe(false);
    expect(descriptor.send.fees.hasCoinControl).toBe(false);
    expect(descriptor.send.fees.presets).toBeUndefined();
    expect(descriptor.send.fees.custom).toBeUndefined();
    expect(descriptor.send.fees.coinControl).toBeUndefined();
    expect(descriptor.send.fees.defaultStrategy).toBeUndefined();
    expect(descriptor.send.fees.getNetworkFeesInfo).toBeUndefined();
    expect(descriptor.send.errors).toBeUndefined();
  });

  it("declares a shielded memo input capped at 512 characters", () => {
    expect(descriptor.send.inputs.memo).toEqual({ type: "text", maxLength: 512 });
  });

  it("allows self-transfer", () => {
    expect(descriptor.send.selfTransfer).toBe("free");
  });
});
