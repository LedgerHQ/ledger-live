import type { BiometricsKind } from "./biometricsTypes";

export function biometricsTypeKey(kind: BiometricsKind): string {
  return `auth.enableBiometrics.${kind.toLowerCase()}`;
}
