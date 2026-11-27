import { toVerifyAddressOperationResult } from "./toVerifyAddressOperationResult";

describe("toVerifyAddressOperationResult", () => {
  it.each(["displayed", "verified"] as const)(
    "should succeed without an outcome when the device showed the address (%s)",
    outcome => {
      expect(toVerifyAddressOperationResult(outcome, "device")).toEqual({
        type: "succeed",
        attributes: {},
      });
    },
  );

  it.each(["prepare", "device"] as const)(
    "should succeed as unsupported when the device cannot show the address, at the %s stage",
    stage => {
      expect(toVerifyAddressOperationResult("unsupported", stage)).toEqual({
        type: "succeed",
        attributes: { outcome: "unsupported" },
      });
    },
  );

  it("should fail as an error that names the mismatch when the device returned another address", () => {
    expect(toVerifyAddressOperationResult("mismatch", "device")).toEqual({
      type: "fail",
      reason: "ERROR",
      attributes: { outcome: "mismatch", error_name: "AddressMismatch" },
    });
  });

  it("should fail as an error at the prepare step when the verification could not start", () => {
    expect(toVerifyAddressOperationResult("failed", "prepare")).toEqual({
      type: "fail",
      reason: "ERROR",
      attributes: { step: "prepare" },
    });
  });

  it("should fail as an error with the annotated error only when the device flow failed", () => {
    expect(toVerifyAddressOperationResult("failed", "device")).toEqual({
      type: "fail",
      reason: "ERROR",
      attributes: {},
    });
  });

  it("should be abandoned as refused when the user refused on the device", () => {
    expect(toVerifyAddressOperationResult("cancelled", "device")).toEqual({
      type: "fail",
      reason: "ABANDONED",
      attributes: { outcome: "refused" },
    });
  });

  it("should be abandoned when the user left before the address was shown", () => {
    expect(toVerifyAddressOperationResult("dismissed", "device")).toEqual({
      type: "fail",
      reason: "ABANDONED",
      attributes: {},
    });
  });
});
