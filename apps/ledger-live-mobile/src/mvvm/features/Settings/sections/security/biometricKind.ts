import type { BiometricKind } from "@features/flow-settings-security";

/** The wording family of a device biometrics type ("FaceID", "TouchID", "Fingerprint", ...). */
export function toBiometricKind(type: string | null | undefined): BiometricKind | null {
  if (!type) return null;
  if (type === "FaceID") return "faceId";
  if (type === "TouchID") return "touchId";
  return "biometrics";
}
