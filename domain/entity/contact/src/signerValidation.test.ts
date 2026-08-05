import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  resolveContactSignerValidationResult,
} from "./signerValidation";

describe("resolveContactSignerValidationResult", () => {
  it("returns valid when the expected and current signers match", () => {
    expect(resolveContactSignerValidationResult("signer-a", "signer-a")).toBe("valid");
  });

  it("returns signer_mismatch when the expected and current signers differ", () => {
    expect(resolveContactSignerValidationResult("signer-a", "signer-b")).toBe(
      CONTACT_SIGNER_MISMATCH_ERROR,
    );
  });

  it("returns signer_mismatch when either signer id is missing", () => {
    expect(resolveContactSignerValidationResult(null, "signer-a")).toBe(
      CONTACT_SIGNER_MISMATCH_ERROR,
    );
    expect(resolveContactSignerValidationResult("signer-a", null)).toBe(
      CONTACT_SIGNER_MISMATCH_ERROR,
    );
    expect(resolveContactSignerValidationResult(undefined, "signer-a")).toBe(
      CONTACT_SIGNER_MISMATCH_ERROR,
    );
  });
});
