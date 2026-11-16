import type { BiometricsKind } from "./biometricsTypes";

const BIOMETRICS_TYPE_KEYS = {
  TouchID: "auth.enableBiometrics.touchid",
  FaceID: "auth.enableBiometrics.faceid",
  Fingerprint: "auth.enableBiometrics.fingerprint",
  OpticID: undefined,
  Face: undefined,
  Iris: undefined,
} as const satisfies Record<BiometricsKind, `auth.enableBiometrics.${string}` | undefined>;

type BiometricsTypeKey = (typeof BIOMETRICS_TYPE_KEYS)[keyof typeof BIOMETRICS_TYPE_KEYS];

export function biometricsTypeKey(kind: BiometricsKind): BiometricsTypeKey {
  return BIOMETRICS_TYPE_KEYS[kind];
}
