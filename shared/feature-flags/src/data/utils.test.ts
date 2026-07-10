import { isValidFeatureId, parseFeatureValue } from "./utils";

describe("isValidFeatureId", () => {
  it("returns true for a registered flag id", () => {
    expect(isValidFeatureId("mockFeature")).toBe(true);
    expect(isValidFeatureId("ptxCard")).toBe(true);
  });

  it("returns false for an unknown id", () => {
    expect(isValidFeatureId("nonexistent_flag_xyz")).toBe(false);
  });
});

describe("parseFeatureValue", () => {
  it.each([
    ["is absent", undefined],
    ["is empty", []],
    ["is not an array", "evm"],
    ["contains an empty family", [" "]],
  ])("normalizes Contacts address families when the value %s", (_, eligibleAddressFamilies) => {
    expect(
      parseFeatureValue("lwdContacts", {
        enabled: true,
        params: { newBadge: true, eligibleAddressFamilies },
      }),
    ).toEqual({
      enabled: true,
      params: { newBadge: true, eligibleAddressFamilies: ["evm"] },
    });
  });

  it("returns undefined when a value does not match its registered schema", () => {
    expect(parseFeatureValue("lwdContacts", { enabled: "true" })).toBeUndefined();
  });
});
