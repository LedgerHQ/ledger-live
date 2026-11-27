import { toBiometricKind } from "./biometricKind";

describe("toBiometricKind", () => {
  it("names Face ID and Touch ID after their device", () => {
    expect(toBiometricKind("FaceID")).toBe("faceId");
    expect(toBiometricKind("TouchID")).toBe("touchId");
  });

  it("falls back to biometrics for the other kinds", () => {
    expect(toBiometricKind("Fingerprint")).toBe("biometrics");
    expect(toBiometricKind("Face")).toBe("biometrics");
    expect(toBiometricKind("OpticID")).toBe("biometrics");
  });

  it("has no kind when the device offers none", () => {
    expect(toBiometricKind(null)).toBeNull();
    expect(toBiometricKind(undefined)).toBeNull();
    expect(toBiometricKind("")).toBeNull();
  });
});
