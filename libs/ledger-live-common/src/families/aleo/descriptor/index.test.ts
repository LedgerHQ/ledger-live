import { TRANSACTION_TYPE } from "../constants";
import { descriptor, getPrivacyAttributes } from "./index";

describe("aleo send descriptor", () => {
  it("declares a single network fee, a free self-transfer and a balance-type step", () => {
    expect(descriptor.send.fees).toEqual({
      hasPresets: false,
      hasCustom: false,
      hasCoinControl: false,
    });
    expect(descriptor.send.inputs.memo).toBeUndefined();
    expect(descriptor.send.selfTransfer).toBe("free");
    expect(descriptor.send.balanceType).toBeDefined();
  });

  describe("getPrivacyAttributes", () => {
    it.each([
      [TRANSACTION_TYPE.TRANSFER_PUBLIC, "public", "public-to-public"],
      [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "public", "public-to-private"],
      [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "private", "private-to-public"],
      [TRANSACTION_TYPE.TRANSFER_PRIVATE, "private", "private-to-private"],
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "private", "private-to-private"],
    ])("reports %s as %s / %s", (mode, privacy, transferFlow) => {
      expect(getPrivacyAttributes({ family: "aleo", mode })).toEqual({ privacy, transferFlow });
    });

    it("reports nothing for a staking transaction", () => {
      expect(
        getPrivacyAttributes({ family: "aleo", mode: TRANSACTION_TYPE.BOND_PUBLIC }),
      ).toBeUndefined();
    });

    it("reports nothing for a non-Aleo transaction", () => {
      expect(getPrivacyAttributes({ family: "zcash", sender: "public" })).toBeUndefined();
    });
  });

  it("feeds the privacy attributes to send-flow tracking", () => {
    expect(
      descriptor.send.getTrackingAttributes?.({
        family: "aleo",
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      }),
    ).toEqual({ privacy: "private", transferFlow: "private-to-private" });
  });
});
