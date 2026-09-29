import { zcashBalanceTypeConfig } from "./balanceType";
import { descriptor, getPrivacyAttributes } from "./index";

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

  // Declaring the pools is what adds the balance-type step to the send flow; their own
  // behavior is covered in `balanceType.test.ts`.
  it("declares its two balance pools", () => {
    expect(descriptor.send.balanceType).toBe(zcashBalanceTypeConfig);
  });

  describe("getTrackingAttributes / getPrivacyAttributes", () => {
    it.each([
      ["transparent", "public", "public", "public-to-public"],
      ["transparent-to-shielded", "public", "private", "public-to-private"],
      ["shielded-to-transparent", "private", "public", "private-to-public"],
      ["shielded", "private", "private", "private-to-private"],
    ] as const)(
      "maps transferType %s (%s sender, %s recipient) to transferFlow %s",
      (transferType, sender, recipientType, transferFlow) => {
        const transaction = { family: "zcash", sender, recipientType, transferType };

        expect(descriptor.send.getTrackingAttributes?.(transaction)).toEqual({
          privacy: sender,
          transferFlow,
        });
        expect(getPrivacyAttributes(transaction)).toEqual({ privacy: sender, transferFlow });
      },
    );

    // The balance-type step precedes the recipient step: `transferType` then assumes a
    // same-pool send, which says nothing about where the funds will actually go.
    it.each([
      ["public", "transparent"],
      ["private", "shielded"],
    ] as const)(
      "reports only privacy for a %s sender before the recipient is classified",
      (sender, transferType) => {
        expect(
          descriptor.send.getTrackingAttributes?.({ family: "zcash", sender, transferType }),
        ).toEqual({ privacy: sender });
      },
    );

    it("returns {} / undefined before a source pool is picked", () => {
      expect(
        descriptor.send.getTrackingAttributes?.({ family: "zcash", transferType: "transparent" }),
      ).toEqual({});
      expect(
        getPrivacyAttributes({ family: "zcash", transferType: "transparent" }),
      ).toBeUndefined();
    });

    it("returns undefined for a non-zcash transaction", () => {
      expect(
        getPrivacyAttributes({ family: "bitcoin", sender: "public", transferType: "transparent" }),
      ).toBeUndefined();
    });

    it("returns undefined for a non-transaction value", () => {
      expect(getPrivacyAttributes(null)).toBeUndefined();
      expect(getPrivacyAttributes(undefined)).toBeUndefined();
    });
  });
});
