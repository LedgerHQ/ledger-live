/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FeatureFlagsStateSchema, FeatureIdSchema, FeatureSchema } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";

describe("FeatureSchema schema", () => {
  it("parses a minimal feature (enabled only)", () => {
    const result = FeatureSchema.parse({ enabled: true });
    expect(result).toEqual({ enabled: true });
  });

  it("parses a full feature with all optional fields", () => {
    const input = {
      enabled: false,
      overridesRemote: true,
      overriddenByEnv: true,
      desktop_version: ">=2.0.0",
      mobile_version: ">=3.0.0",
      enabledOverriddenForCurrentVersion: true,
      languages_whitelisted: ["en", "fr"],
      languages_blacklisted: ["de"],
      enabledOverriddenForCurrentLanguage: false,
    };
    expect(FeatureSchema.parse(input)).toEqual(input);
  });

  it("rejects when enabled is missing", () => {
    expect(() => FeatureSchema.parse({})).toThrow();
  });

  it("rejects when enabled is not boolean", () => {
    expect(() => FeatureSchema.parse({ enabled: "yes" })).toThrow();
  });
});

describe("FeatureFlagsStateSchema", () => {
  it("parses a valid state with overrides and resolved", () => {
    const input = {
      overrides: { mockFeature: { enabled: true } },
      resolved: { ...FEATURE_FLAGS_DEFAULTS, mockFeature: { enabled: true } },
      bannerVisible: false,
    };
    expect(FeatureFlagsStateSchema.parse(input)).toEqual(input);
  });

  it("parses state with empty overrides and default resolved", () => {
    const input = {
      overrides: {},
      resolved: FEATURE_FLAGS_DEFAULTS,
      bannerVisible: false,
    };
    expect(FeatureFlagsStateSchema.parse(input)).toEqual(input);
  });

  it("fills in defaults for missing flags in resolved", () => {
    const result = FeatureFlagsStateSchema.parse({
      overrides: {},
      resolved: {},
      bannerVisible: false,
    });
    expect(result.resolved).toEqual(FEATURE_FLAGS_DEFAULTS);
    expect(result.overrides).toEqual({});
  });

  it("rejects when resolved is missing", () => {
    expect(() => FeatureFlagsStateSchema.parse({ overrides: {}, bannerVisible: false })).toThrow();
  });
});

describe("FeatureIdSchema", () => {
  it("accepts known flag ids", () => {
    expect(FeatureIdSchema.parse("mockFeature")).toBe("mockFeature");
    expect(FeatureIdSchema.parse("ptxCard")).toBe("ptxCard");
  });

  it("rejects unknown flag ids", () => {
    expect(() => FeatureIdSchema.parse("nonexistent_flag_xyz")).toThrow();
  });
});
