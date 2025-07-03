import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import type { Feature_StakePrograms } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { useMemo } from "react";
import semver from "semver";

export function getVersionedRedirects(
  stakeProgramsFeature: Feature_StakePrograms,
  appVersion: string,
): Feature_StakePrograms {
  const { list, redirects, versions } = stakeProgramsFeature.params ?? {};
  if (!versions || versions.length === 0) {
    return {
      enabled: stakeProgramsFeature.enabled,
      params: {
        list: list || [],
        redirects: redirects || {},
      },
    };
  }

  const versionKey = "desktop_version";

  const sortedVersions = [...versions].sort((a, b) => {
    const aMin = semver.minVersion(a[versionKey] || "0.0.0");
    const bMin = semver.minVersion(b[versionKey] || "0.0.0");

    if (!aMin || !bMin) return 0;

    return semver.compare(aMin, bMin);
  });

  const applicableVersion = sortedVersions.find(versionEntry => {
    const entryVersion = versionEntry[versionKey];
    if (!entryVersion) return false;
    return semver.satisfies(appVersion, entryVersion, { includePrerelease: true });
  });

  const versionSpecificRedirects = applicableVersion ? applicableVersion.redirects : {};

  return {
    enabled: stakeProgramsFeature.enabled,
    params: {
      list: list || [],
      redirects: { ...redirects, ...versionSpecificRedirects },
    },
  };
}

/**
 * Hook that provides version-aware stake program features
 * This wrapper handles the versioned redirects logic and returns a standard Feature_StakePrograms object
 * @returns Feature_StakePrograms object with the appropriate redirects for the current app version
 */
export const useVersionedStakePrograms = (): Feature_StakePrograms | null => {
  const rawStakePrograms = useFeature("stakePrograms");

  const appVersion = LiveConfig.instance.appVersion || "0.0.0";
  return useMemo(() => {
    if (!rawStakePrograms) {
      return null;
    }

    return getVersionedRedirects(rawStakePrograms, appVersion);
  }, [rawStakePrograms, appVersion]);
};
