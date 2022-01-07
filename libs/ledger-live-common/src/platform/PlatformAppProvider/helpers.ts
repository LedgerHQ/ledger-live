import type { AppManifest } from "../types";
import semver from "semver";
export type FilterParams = {
  branches?: string[];
  platform?: string;
  private?: boolean;
  version?: string;
};
import { getEnv } from "../../env";

function matchVersion(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.version ||
    semver.satisfies(
      semver.coerce(filterParams.version) || "",
      manifest.apiVersion
    )
  );
}

function matchBranches(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.branches || filterParams.branches.includes(manifest.branch)
  );
}

function matchPlatform(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.platform ||
    manifest.platform === "all" ||
    filterParams.platform === manifest.platform
  );
}

function matchPrivate(filterParams: FilterParams, manifest: AppManifest) {
  return filterParams.private === true || !(manifest.private === true);
}

export function filterPlatformApps(
  appManifests: AppManifest[],
  filterParams: FilterParams
): AppManifest[] {
  return appManifests.filter((appManifest: AppManifest) => {
    return (
      matchBranches(filterParams, appManifest) &&
      matchPlatform(filterParams, appManifest) &&
      matchPrivate(filterParams, appManifest) &&
      matchVersion(filterParams, appManifest)
    );
  });
}
export function mergeManifestLists(
  list1: AppManifest[],
  list2: AppManifest[]
): AppManifest[] {
  const newIds = new Set(list2.map((elem) => elem.id));
  return [...list1.filter((elem) => !newIds.has(elem.id)), ...list2];
}

export const initializeLocalManifest = (): Map<string, AppManifest> => {
  const localManifestJsonRaw: string | null | undefined = getEnv(
    "PLATFORM_LOCAL_MANIFEST_JSON"
  );

  if (!localManifestJsonRaw) {
    return new Map();
  }

  try {
    const manifest: AppManifest | [AppManifest] =
      JSON.parse(localManifestJsonRaw);

    const manifestArray = Array.isArray(manifest) ? manifest : [manifest];

    const map = new Map(manifestArray.map((m) => [m.id, m]));

    return map;
  } catch (error) {
    /**
     * Probable error during `JSON.parse` call, log error and return empty map
     * as if env variable was not defined
     */
    console.error(error);
    return new Map();
  }
};
