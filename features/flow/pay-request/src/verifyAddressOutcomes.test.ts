import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { payVerifyAddressOutcomes } from "./verifyAddressOutcomes";

const verified: VerifyAddressIntentJobState = { type: "verified", address: "0xabc" };
const mismatch: VerifyAddressIntentJobState = {
  type: "mismatch",
  expectedAddress: "0xabc",
  reportedAddress: "0xdef",
};
const unsupported: VerifyAddressIntentJobState = {
  type: "unsupported",
  error: new Error("cannot display"),
};
const cancelled: VerifyAddressIntentJobState = { type: "cancelled", retry: () => undefined };

describe("payVerifyAddressOutcomes", () => {
  it("ends the session from a verified job only", () => {
    expect(payVerifyAddressOutcomes.fromJobState(verified)).toBe("verified");
    expect(payVerifyAddressOutcomes.fromJobState(mismatch)).toBeUndefined();
    expect(payVerifyAddressOutcomes.fromJobState(unsupported)).toBeUndefined();
    expect(payVerifyAddressOutcomes.fromJobState(cancelled)).toBeUndefined();
    expect(payVerifyAddressOutcomes.fromJobState({ type: "addressDisplayed" })).toBeUndefined();
  });

  it("maps a cancel to the last job state, and to dismissed otherwise", () => {
    expect(payVerifyAddressOutcomes.fromUserCancel(mismatch)).toBe("mismatch");
    expect(payVerifyAddressOutcomes.fromUserCancel(unsupported)).toBe("unsupported");
    expect(payVerifyAddressOutcomes.fromUserCancel(cancelled)).toBe("cancelled");
    expect(payVerifyAddressOutcomes.fromUserCancel(verified)).toBe("dismissed");
    expect(payVerifyAddressOutcomes.fromUserCancel(undefined)).toBe("dismissed");
  });

  it("reports a failed setup as initFailed", () => {
    expect(payVerifyAddressOutcomes.setupFailed).toBe("initFailed");
  });
});
