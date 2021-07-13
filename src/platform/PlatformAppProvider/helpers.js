// @flow

import type { AppManifest } from "../types";

export type FilterParams = {
  branches?: string[],
  platform?: string,
  private?: boolean,
};

export function filterPlatformApps(
  appManifests: AppManifest[],
  filterParams: FilterParams
): AppManifest[] {
  return appManifests.filter((appManifest: AppManifest) => {
    if (
      filterParams.branches &&
      !filterParams.branches.includes(appManifest.branch)
    ) {
      return false;
    }

    if (
      filterParams.platform &&
      filterParams.platform !== "all" &&
      filterParams.platform !== appManifest.platform
    ) {
      return false;
    }

    if (filterParams.private) {
      return false;
    }

    return true;
  });
}

export function mergeManigestLists(
  list1: AppManifest[],
  list2: AppManifest[]
): AppManifest[] {
  const newIds = new Set(list2.map((elem) => elem.id));
  return [...list1.filter((elem) => !newIds.has(elem.id)), ...list2];
}
