import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { filterPlatformApps } from "@ledgerhq/live-common/platform/PlatformAppProvider/helpers";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/providers/types";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { useMemo } from "react";

const defaultArray: LiveAppManifest[] = [];

export const useFilteredManifests = () => {
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
      version: "0.0.1",
      platform: "mobile",
      branches,
    });
  }, [manifests, experimental]);
};
