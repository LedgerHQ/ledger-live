import { useFeature } from "@features/platform-feature-flags";
import type { Features } from "@shared/feature-flags";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { useMemo } from "react";
import semver from "semver";

export function getVersionedRedirects(
  stakeProgramsFeature: Features["stakePrograms"],
  appVersion: string,
): Features["stakePrograms"] {
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
 * This wrapper handles the versioned redirects logic and returns a standard Features["stakePrograms"] object
 * @returns Features["stakePrograms"] object with the appropriate redirects for the current app version
 */
export const useVersionedStakePrograms = (): Features["stakePrograms"] | null => {
  const rawStakePrograms = useFeature("stakePrograms");

  const appVersion = LiveConfig.instance.appVersion || "0.0.0";
  return useMemo(() => {
    if (!rawStakePrograms) {
      return null;
    }

    return getVersionedRedirects(rawStakePrograms, appVersion);
  }, [rawStakePrograms, appVersion]);
};
