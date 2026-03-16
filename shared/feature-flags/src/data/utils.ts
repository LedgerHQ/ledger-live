import semver from "semver";
import { type ResolutionConfig } from "../config";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import {
  type Feature,
  type FeatureId,
  type FeatureFlagsState,
  type PartialFeatures,
  FeatureIdSchema,
} from "./schema";

/**
 * Checks whether the feature flag should be disabled based on a semver version
 * constraint. Uses `desktop_version` for desktop and `mobile_version` for
 * ios/android. Returns the feature unchanged when disabled, no platform is
 * given, or no constraint exists.
 *
 * @param feature
 * The feature flag to check.
 *
 * @param platform
 * The current platform identifier.
 *
 * @param appVersion
 * The current application semver version.
 *
 * @return
 * The original feature, or a copy with `enabled: false` and
 * `enabledOverriddenForCurrentVersion: true` when the version does not satisfy
 * the constraint.
 */
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
    return { ...feature, enabled: false, enabledOverriddenForCurrentVersion: true };
  }
  return feature;
}

/**
 * Disables the feature flag when the current language is not in the whitelist
 * or is in the blacklist. Returns the feature unchanged when disabled, no
 * language is given, or no language filters exist.
 *
 * @param feature
 * The feature flag to filter.
 *
 * @param appLanguage
 * The current application language code (e.g. "en", "fr").
 *
 * @return
 * The original feature, or a copy with `enabled: false` and
 * `enabledOverriddenForCurrentLanguage: true` when filtered out.
 */
export function applyLanguageFilter(feature: Feature, appLanguage?: string): Feature {
  if (
    feature.enabled &&
    appLanguage &&
    ((feature.languages_whitelisted && !feature.languages_whitelisted.includes(appLanguage)) ||
      (feature.languages_blacklisted && feature.languages_blacklisted.includes(appLanguage)))
  ) {
    return { ...feature, enabled: false, enabledOverriddenForCurrentLanguage: true };
  }
  return feature;
}

/**
 * Resolves a single feature flag value using the priority chain:
 * local override > env override > remote config > default.
 *
 * Local overrides are version-checked but not language-filtered (the user
 * explicitly set them). Env overrides are returned as-is with `overriddenByEnv`
 * and `overridesRemote` markers. Remote flags go through both language and
 * version filtering.
 *
 * @param key
 * The feature flag identifier.
 *
 * @param overrides
 * User-defined local overrides map.
 *
 * @param remoteFlags
 * Remote feature flag values from Firebase/LiveConfig.
 *
 * @param config
 * Platform, version, language, and env flags for resolution.
 *
 * @return
 * The resolved feature flag value.
 */
export function resolveFeature(
  key: FeatureId,
  overrides: PartialFeatures,
  remoteFlags: PartialFeatures,
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

  const remote = remoteFlags?.[key];
  if (remote) {
    const afterLang = applyLanguageFilter(remote, appLanguage);
    return checkFeatureFlagVersion(afterLang, platform, appVersion);
  }

  return FEATURE_FLAGS_DEFAULTS[key];
}

/**
 * Resolves every registered feature flag.
 * Iterates over all known flag IDs and calls `resolveFeature` for each.
 *
 * @param overrides
 * User-defined local overrides map.
 *
 * @param remoteFlags
 * Remote feature flag values from Firebase/LiveConfig.
 *
 * @param config
 * Platform, version, language, and env flags for resolution.
 *
 * @return
 * A new fully-resolved features map.
 */
export function resolveAll(
  overrides: PartialFeatures,
  remoteFlags: PartialFeatures,
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
