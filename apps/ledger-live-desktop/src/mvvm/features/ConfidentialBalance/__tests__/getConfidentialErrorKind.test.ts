import { ConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { DeviceRefusedError } from "../utils/confidentialApi";
import { getConfidentialErrorKind } from "../utils/getConfidentialErrorKind";

describe("getConfidentialErrorKind", () => {
  it("reports a refusal on the device", () => {
    expect(getConfidentialErrorKind(new DeviceRefusedError())).toBe("deviceRefused");
  });

  it("reports a rejection on the device as a refusal", () => {
    const refusal = Object.assign(new Error("Condition of use not satisfied"), {
      name: "UserRefusedOnDevice",
    });
    expect(getConfidentialErrorKind(refusal)).toBe("deviceRefused");
  });

  it.each([
    ["PermitRequired", "permitExpired"],
    ["PermitExpired", "permitExpired"],
    ["PermitChainMismatch", "permitChainMismatch"],
    ["KmsContextRevoked", "kmsContextRevoked"],
    ["AclDenied", "aclDenied"],
    ["Denylisted", "denylisted"],
    ["Unavailable", "serviceUnavailable"],
    ["OracleUnavailable", "serviceUnavailable"],
    ["RelayerError", "serviceUnavailable"],
    ["ZeroBalance", "unknown"],
  ] as const)("maps %s to %s", (code, kind) => {
    expect(getConfidentialErrorKind(new ConfidentialError(code))).toBe(kind);
  });

  it("reports a balance the relayer has not processed yet as pending, not unavailable", () => {
    const sdkError = new Error("Ciphertext not ready for decryption on the gateway chain");
    expect(
      getConfidentialErrorKind(
        new ConfidentialError("RelayerError", "relayer request failed", { cause: sdkError }),
      ),
    ).toBe("decryptionPending");
    expect(
      getConfidentialErrorKind(new ConfidentialError("RelayerError", "readiness_check_timed_out")),
    ).toBe("decryptionPending");
  });

  it("treats any other failure as unknown", () => {
    expect(getConfidentialErrorKind(new Error("boom"))).toBe("unknown");
  });
});
