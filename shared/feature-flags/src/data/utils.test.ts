/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Feature, FeatureFlagsState } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import { checkFeatureFlagVersion, applyLanguageFilter, resolveFeature, resolveAll } from "./utils";

const defaults = FEATURE_FLAGS_DEFAULTS as FeatureFlagsState["resolved"];

const enabled: Feature = { enabled: true };
const disabled: Feature = { enabled: false };

describe("checkFeatureFlagVersion", () => {
  it("returns feature as-is when disabled", () => {
    expect(checkFeatureFlagVersion(disabled, "desktop", "1.0.0")).toEqual(disabled);
  });

  it("returns feature as-is when no platform is provided", () => {
    expect(checkFeatureFlagVersion(enabled, undefined, "1.0.0")).toEqual(enabled);
  });

  it("returns feature as-is when no version constraint exists", () => {
    expect(checkFeatureFlagVersion(enabled, "desktop", "1.0.0")).toEqual(enabled);
  });

  it("disables flag when desktop_version constraint is not satisfied", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=2.0.0" };
    const result = checkFeatureFlagVersion(feature, "desktop", "1.0.0");
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentVersion).toBe(true);
  });

  it("keeps flag enabled when desktop_version constraint is satisfied", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=2.0.0" };
    const result = checkFeatureFlagVersion(feature, "desktop", "3.0.0");
    expect(result.enabled).toBe(true);
    expect(result.enabledOverriddenForCurrentVersion).toBeUndefined();
  });

  it("uses mobile_version for ios platform", () => {
    const feature: Feature = { enabled: true, mobile_version: ">=2.0.0" };
    expect(checkFeatureFlagVersion(feature, "ios", "1.0.0").enabled).toBe(false);
    expect(checkFeatureFlagVersion(feature, "ios", "3.0.0").enabled).toBe(true);
  });

  it("uses mobile_version for android platform", () => {
    const feature: Feature = { enabled: true, mobile_version: ">=2.0.0" };
    expect(checkFeatureFlagVersion(feature, "android", "1.5.0").enabled).toBe(false);
    expect(checkFeatureFlagVersion(feature, "android", "2.1.0").enabled).toBe(true);
  });

  it("ignores desktop_version on mobile platforms", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=99.0.0" };
    expect(checkFeatureFlagVersion(feature, "ios", "1.0.0").enabled).toBe(true);
  });

  it("ignores mobile_version on desktop platform", () => {
    const feature: Feature = { enabled: true, mobile_version: ">=99.0.0" };
    expect(checkFeatureFlagVersion(feature, "desktop", "1.0.0").enabled).toBe(true);
  });

  it("supports prerelease versions when they satisfy the constraint", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=2.0.0" };
    expect(checkFeatureFlagVersion(feature, "desktop", "2.1.0-rc.1").enabled).toBe(true);
  });

  it("rejects prerelease versions below the constraint", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=2.0.0" };
    expect(checkFeatureFlagVersion(feature, "desktop", "2.0.0-rc.1").enabled).toBe(false);
  });

  it("returns feature as-is when version constraint exists but appVersion is missing", () => {
    const feature: Feature = { enabled: true, desktop_version: ">=2.0.0" };
    expect(checkFeatureFlagVersion(feature, "desktop", undefined).enabled).toBe(true);
  });
});

describe("applyLanguageFilter", () => {
  it("returns feature as-is when disabled", () => {
    expect(applyLanguageFilter(disabled, "en")).toEqual(disabled);
  });

  it("returns feature as-is when no language provided", () => {
    const feature: Feature = { enabled: true, languages_whitelisted: ["en"] };
    expect(applyLanguageFilter(feature, undefined).enabled).toBe(true);
  });

  it("returns feature as-is when no language filters exist", () => {
    expect(applyLanguageFilter(enabled, "de").enabled).toBe(true);
  });

  it("disables flag when language is not in whitelist", () => {
    const feature: Feature = { enabled: true, languages_whitelisted: ["en", "fr"] };
    const result = applyLanguageFilter(feature, "de");
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("keeps flag enabled when language is in whitelist", () => {
    const feature: Feature = { enabled: true, languages_whitelisted: ["en", "fr"] };
    expect(applyLanguageFilter(feature, "en").enabled).toBe(true);
  });

  it("disables flag when language is in blacklist", () => {
    const feature: Feature = { enabled: true, languages_blacklisted: ["de", "ja"] };
    const result = applyLanguageFilter(feature, "de");
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("keeps flag enabled when language is not in blacklist", () => {
    const feature: Feature = { enabled: true, languages_blacklisted: ["de"] };
    expect(applyLanguageFilter(feature, "en").enabled).toBe(true);
  });
});

describe("resolveFeature", () => {
  it("returns local override when present", () => {
    const overrides = {
      mockFeature: { enabled: true, overridesRemote: true },
    } as FeatureFlagsState["overrides"];
    const result = resolveFeature("mockFeature", overrides, {}, {});
    expect(result).toEqual({ enabled: true, overridesRemote: true });
  });

  it("applies version check to local overrides", () => {
    const overrides = {
      mockFeature: { enabled: true, desktop_version: ">=9.0.0" },
    } as FeatureFlagsState["overrides"];
    const result = resolveFeature(
      "mockFeature",
      overrides,
      {},
      { platform: "desktop", appVersion: "1.0.0" },
    );
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentVersion).toBe(true);
  });

  it("returns env flag when no local override, marking it as env-overridden", () => {
    const envFlags = {
      mockFeature: { enabled: true, params: { x: 1 } },
    } as FeatureFlagsState["overrides"];
    const result = resolveFeature("mockFeature", {}, {}, { envFlags });
    expect(result.enabled).toBe(true);
    expect(result.overriddenByEnv).toBe(true);
    expect(result.overridesRemote).toBe(true);
  });

  it("local override takes priority over env flag", () => {
    const overrides = { mockFeature: { enabled: false } } as FeatureFlagsState["overrides"];
    const envFlags = { mockFeature: { enabled: true } } as FeatureFlagsState["overrides"];
    const result = resolveFeature("mockFeature", overrides, {}, { envFlags });
    expect(result.enabled).toBe(false);
    expect(result.overriddenByEnv).toBeUndefined();
  });

  it("returns remote flag with language and version filtering", () => {
    const remote = { mockFeature: { enabled: true, languages_whitelisted: ["en"] } };
    const result = resolveFeature("mockFeature", {}, remote, { appLanguage: "de" });
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("env flag takes priority over remote", () => {
    const envFlags = { mockFeature: { enabled: false } } as FeatureFlagsState["overrides"];
    const remote = { mockFeature: { enabled: true } };
    const result = resolveFeature("mockFeature", {}, remote, { envFlags });
    expect(result.enabled).toBe(false);
    expect(result.overriddenByEnv).toBe(true);
  });

  it("falls back to defaults when no override, env, or remote", () => {
    const result = resolveFeature("mockFeature", {}, {}, {});
    expect(result).toEqual(FEATURE_FLAGS_DEFAULTS["mockFeature"]);
  });

  it("handles undefined remoteFlags gracefully", () => {
    const result = resolveFeature("mockFeature", {}, undefined as any, {});
    expect(result).toEqual(FEATURE_FLAGS_DEFAULTS["mockFeature"]);
  });

  it("handles empty remoteFlags for a key not present", () => {
    const result = resolveFeature("mockFeature", {}, {}, {});
    expect(result).toEqual(FEATURE_FLAGS_DEFAULTS["mockFeature"]);
  });

  it("remote flag goes through both language and version filtering", () => {
    const remote = {
      mockFeature: { enabled: true, desktop_version: ">=2.0.0", languages_whitelisted: ["en"] },
    };
    const result = resolveFeature("mockFeature", {}, remote, {
      platform: "desktop",
      appVersion: "3.0.0",
      appLanguage: "de",
    });
    expect(result.enabled).toBe(false);
    expect(result.enabledOverriddenForCurrentLanguage).toBe(true);
  });
});

describe("resolveAll", () => {
  it("resolves every registered flag", () => {
    const result = resolveAll({}, { mockFeature: { enabled: true } }, {});
    expect(result.mockFeature).toEqual({ enabled: true });
    expect(result.ptxCard.enabled).toBe(false);
  });

  it("applies overrides across all flags", () => {
    const overrides = {
      mockFeature: { enabled: true },
      ptxCard: { enabled: true },
    } as FeatureFlagsState["overrides"];
    const result = resolveAll(overrides, {}, {});
    expect(result.mockFeature.enabled).toBe(true);
    expect(result.ptxCard.enabled).toBe(true);
  });

  it("falls back to defaults when no overrides or remote", () => {
    const result = resolveAll({}, {}, {});
    expect(result).toEqual(defaults);
  });

  it("remote values are used for flags without overrides", () => {
    const remote = {
      mockFeature: { enabled: true, params: { v: 1 } },
      ptxCard: { enabled: true },
    };
    const result = resolveAll({}, remote, {});
    expect(result.mockFeature).toEqual({ enabled: true, params: { v: 1 } });
    expect(result.ptxCard).toEqual({ enabled: true });
  });

  it("overrides take priority over remote values", () => {
    const overrides = { mockFeature: { enabled: false } } as FeatureFlagsState["overrides"];
    const remote = { mockFeature: { enabled: true, params: { v: 1 } } };
    const result = resolveAll(overrides, remote, {});
    expect(result.mockFeature).toEqual({ enabled: false });
  });

  it("env flags take priority over remote values", () => {
    const envFlags = { mockFeature: { enabled: false } } as FeatureFlagsState["overrides"];
    const remote = { mockFeature: { enabled: true } };
    const result = resolveAll({}, remote, { envFlags });
    expect(result.mockFeature.enabled).toBe(false);
    expect(result.mockFeature.overriddenByEnv).toBe(true);
  });

  it("applies version filtering to remote values", () => {
    const remote = { mockFeature: { enabled: true, desktop_version: ">=5.0.0" } };
    const result = resolveAll({}, remote, { platform: "desktop", appVersion: "2.0.0" });
    expect(result.mockFeature.enabled).toBe(false);
    expect(result.mockFeature.enabledOverriddenForCurrentVersion).toBe(true);
  });

  it("applies language filtering to remote values", () => {
    const remote = { mockFeature: { enabled: true, languages_whitelisted: ["en"] } };
    const result = resolveAll({}, remote, { appLanguage: "de" });
    expect(result.mockFeature.enabled).toBe(false);
    expect(result.mockFeature.enabledOverriddenForCurrentLanguage).toBe(true);
  });
});
