import { CursorTouch, FaceId, Fingerprint } from "@ledgerhq/lumen-ui-rnative/symbols";
import { biometricsSymbol } from "./biometricsSymbol";

describe("the symbol standing for the device's biometrics", () => {
  it.each(["TouchID", "Fingerprint"] as const)("shows a fingertip for %s", kind => {
    expect(biometricsSymbol(kind)).toBe(Fingerprint);
  });

  it.each(["FaceID", "Face", "OpticID", "Iris"] as const)("shows a face for %s", kind => {
    expect(biometricsSymbol(kind)).toBe(FaceId);
  });

  it("keeps the generic touch while the device has not said which it has", () => {
    expect(biometricsSymbol(undefined)).toBe(CursorTouch);
  });
});
