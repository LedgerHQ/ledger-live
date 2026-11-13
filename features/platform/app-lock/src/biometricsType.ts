import type { BiometricsKind } from "./biometricsTypes";

const BIOMETRICS_TYPE_KEYS = {
  TouchID: "auth.enableBiometrics.touchid",
  FaceID: "auth.enableBiometrics.faceid",
  Fingerprint: "auth.enableBiometrics.fingerprint",
} as const satisfies Partial<Record<BiometricsKind, string>>;

type WordedBiometricsKind = keyof typeof BIOMETRICS_TYPE_KEYS;

export type BiometricsTypeKey = (typeof BIOMETRICS_TYPE_KEYS)[WordedBiometricsKind];

function hasWording(kind: BiometricsKind): kind is WordedBiometricsKind {
  return Object.hasOwn(BIOMETRICS_TYPE_KEYS, kind);
}

export function biometricsTypeKey(kind: BiometricsKind): BiometricsTypeKey | undefined {
  return hasWording(kind) ? BIOMETRICS_TYPE_KEYS[kind] : undefined;
}
