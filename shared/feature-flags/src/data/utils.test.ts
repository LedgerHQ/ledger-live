import { isValidFeatureId } from "./utils";

describe("isValidFeatureId", () => {
  it("returns true for a registered flag id", () => {
    expect(isValidFeatureId("mockFeature")).toBe(true);
    expect(isValidFeatureId("ptxCard")).toBe(true);
  });

  it("returns false for an unknown id", () => {
    expect(isValidFeatureId("nonexistent_flag_xyz")).toBe(false);
  });
});
