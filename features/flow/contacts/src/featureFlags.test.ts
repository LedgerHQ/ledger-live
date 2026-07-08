import { resolveContactsFeatureConfig } from "./featureFlags";

describe("resolveContactsFeatureConfig", () => {
  it("returns disabled config without a feature value", () => {
    expect(resolveContactsFeatureConfig(null)).toEqual({
      isEnabled: false,
      showNewBadge: false,
    });
  });

  it("returns disabled config when the flag is disabled", () => {
    expect(resolveContactsFeatureConfig({ enabled: false, params: { newFlag: true } })).toEqual({
      isEnabled: false,
      showNewBadge: false,
    });
  });

  it("returns enabled config without a new badge when the flag is enabled only", () => {
    expect(resolveContactsFeatureConfig({ enabled: true, params: { newFlag: false } })).toEqual({
      isEnabled: true,
      showNewBadge: false,
    });
  });

  it("returns enabled config with a new badge only when the flag and param are enabled", () => {
    expect(resolveContactsFeatureConfig({ enabled: true, params: { newFlag: true } })).toEqual({
      isEnabled: true,
      showNewBadge: true,
    });
  });
});
