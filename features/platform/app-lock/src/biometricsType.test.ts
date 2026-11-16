import { biometricsTypeKey } from "./biometricsType";
import type { BiometricsKind } from "./biometricsTypes";

describe("biometricsTypeKey", () => {
  it.each<[BiometricsKind, string]>([
    ["TouchID", "auth.enableBiometrics.touchid"],
    ["FaceID", "auth.enableBiometrics.faceid"],
    ["Fingerprint", "auth.enableBiometrics.fingerprint"],
  ])("maps %s to its wording key", (kind, key) => {
    expect(biometricsTypeKey(kind)).toBe(key);
  });

  it.each<BiometricsKind>(["OpticID", "Face", "Iris"])("has no wording key for %s", kind => {
    expect(biometricsTypeKey(kind)).toBeUndefined();
  });
});
