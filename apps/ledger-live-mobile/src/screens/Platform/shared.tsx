import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import {
  FilterParams,
  filterPlatformApps,
} from "@ledgerhq/live-common/platform/filters";
import { getPlatformVersion } from "@ledgerhq/live-common/platform/version";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/providers/types";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { useMemo } from "react";

const defaultArray: LiveAppManifest[] = [];

export const useFilteredManifests = (filterParamsOverride?: FilterParams) => {
  const { state } = useRemoteLiveAppContext();
  const manifests = state?.value?.liveAppByIndex || defaultArray;
  const experimental = useEnv("PLATFORM_EXPERIMENTAL_APPS");

  return useMemo(() => {
    const branches = [
      "stable",
      "soon",
      ...(experimental ? ["experimental"] : []),
    ];

    // TODO improve types, mismatch between LiveAppManifest & AppManifest
    return filterPlatformApps(Array.from(manifests.values()) as AppManifest[], {
      version: getPlatformVersion(),
      platform: "mobile",
      branches,
      ...(filterParamsOverride ?? {}),
    });
  }, [manifests, experimental, filterParamsOverride]);
};
