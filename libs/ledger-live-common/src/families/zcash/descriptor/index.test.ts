import { descriptor } from "./index";

// Vectors shared with coin-zcash's `logic/address.test.ts`.
const UA_WITH_ORCHARD =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const UA_TRANSPARENT_ONLY = "u1fcd2t573p0qtf3sz7dft0rwtcmg5q9cxkr8l4c3reshlugr8pr2l5aeersajvcatx6e";
const T1_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";

const appliesToRecipient = (recipient: string) =>
  descriptor.send.inputs.memo?.appliesToRecipient?.(recipient);

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
    expect(descriptor.send.inputs.memo).toMatchObject({ type: "text", maxLength: 512 });
  });

  describe("memo applicability", () => {
    it("applies to a UA carrying an Orchard receiver", () => {
      expect(appliesToRecipient(UA_WITH_ORCHARD)).toBe(true);
    });

    // A memo rides in the shielded output; these recipients get a transparent one,
    // which has nowhere to carry it -- so the flow must not offer the input.
    it.each([
      ["a t1 address", T1_ADDRESS],
      ["a UA with transparent receivers only", UA_TRANSPARENT_ONLY],
      ["an unparseable address", "not-an-address"],
      ["an empty recipient", ""],
    ])("does not apply to %s", (_label, recipient) => {
      expect(appliesToRecipient(recipient)).toBe(false);
    });
  });

  it("allows self-transfer", () => {
    expect(descriptor.send.selfTransfer).toBe("free");
  });
});
