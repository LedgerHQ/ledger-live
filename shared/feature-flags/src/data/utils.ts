import semver from "semver";
import { type ResolutionConfig } from "../config";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import {
  type Feature,
  type FeatureId,
  type FeatureFlagsState,
  FeatureIdSchema,
  type OptionalFeatureMap,
} from "./schema";

export function checkFeatureFlagVersion(
  feature: Feature,
  platform?: string,
  appVersion?: string,
): Feature {
  if (!feature?.enabled || !platform) return feature;

  const versionConstraint =
    platform === "desktop"
      ? feature.desktop_version
      : platform === "ios" || platform === "android"
        ? feature.mobile_version
        : undefined;

  if (
    versionConstraint &&
    appVersion &&
    !semver.satisfies(appVersion, versionConstraint, { includePrerelease: true })
  ) {
    return { enabledOverriddenForCurrentVersion: true, ...feature, enabled: false };
  }
  return feature;
}

export function applyLanguageFilter(feature: Feature, appLanguage?: string): Feature {
  if (
    feature.enabled &&
    appLanguage &&
    ((feature.languages_whitelisted && !feature.languages_whitelisted.includes(appLanguage)) ||
      (feature.languages_blacklisted && feature.languages_blacklisted.includes(appLanguage)))
  ) {
    return { enabledOverriddenForCurrentLanguage: true, ...feature, enabled: false };
  }
  return feature;
}

export function resolveFeature(
  key: FeatureId,
  overrides: FeatureFlagsState["overrides"],
  remoteFlags: Record<string, Feature>,
  config: ResolutionConfig,
): Feature {
  const { platform, appVersion, appLanguage, envFlags } = config;

  const localOverride = overrides[key];
  if (localOverride) {
    return checkFeatureFlagVersion(localOverride, platform, appVersion);
  }

  if (envFlags) {
    const envFeature = envFlags[key];
    if (envFeature) {
      return { ...envFeature, overridesRemote: true, overriddenByEnv: true };
    }
  }

  const remote = remoteFlags[key];
  if (remote) {
    const afterLang = applyLanguageFilter(remote, appLanguage);
    return checkFeatureFlagVersion(afterLang, platform, appVersion);
  }

  return FEATURE_FLAGS_DEFAULTS[key];
}

export function resolveAll(
  overrides: FeatureFlagsState["overrides"],
  currentResolved: FeatureFlagsState["resolved"],
  config: ResolutionConfig,
): FeatureFlagsState["resolved"] {
  const remoteFlags = extractRemoteFlags(currentResolved, overrides, config.envFlags);
  return resolveAllFromRemote(overrides, remoteFlags, config);
}

export function resolveAllFromRemote(
  overrides: FeatureFlagsState["overrides"],
  remoteFlags: Record<string, Feature>,
  config: ResolutionConfig,
): FeatureFlagsState["resolved"] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = {} as Record<string, Feature>;
  for (const key of FeatureIdSchema.options) {
    result[key] = resolveFeature(key, overrides, remoteFlags, config);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return result as FeatureFlagsState["resolved"];
}

/**
 * Extract the "remote" base flags from the current resolved state
 * by stripping out anything that was locally overridden or env-overridden.
 */
export function extractRemoteFlags(
  currentResolved: FeatureFlagsState["resolved"],
  overrides: FeatureFlagsState["overrides"],
  envFlags?: OptionalFeatureMap,
): OptionalFeatureMap {
  return FeatureIdSchema.options.reduce(
    (acc, key) => {
      const resolved = currentResolved[key];
      if (resolved && !overrides[key] && !envFlags?.[key]) {
        acc[key] = resolved;
      }
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as OptionalFeatureMap,
  );
}
