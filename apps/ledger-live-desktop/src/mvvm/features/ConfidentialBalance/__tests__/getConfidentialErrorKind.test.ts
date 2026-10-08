import { ConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { DeviceRefusedError } from "../utils/confidentialApi";
import { getConfidentialErrorKind } from "../utils/getConfidentialErrorKind";

describe("getConfidentialErrorKind", () => {
  it("reports a refusal on the device", () => {
    expect(getConfidentialErrorKind(new DeviceRefusedError())).toBe("deviceRefused");
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

  it("treats any other failure as unknown", () => {
    expect(getConfidentialErrorKind(new Error("boom"))).toBe("unknown");
  });
});
