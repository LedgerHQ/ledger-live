import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { usePlatformApp } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider";
import { filterPlatformApps } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider/helpers";
import { useMemo } from "react";

export const useFilteredManifests = () => {
  const { manifests } = usePlatformApp();
  const experimental = useEnv("PLATFORM_EXPERIMENTAL_APPS");

  return useMemo(() => {
    const branches = [
      "stable",
      "soon",
      ...(experimental ? ["experimental"] : []),
    ];

    return filterPlatformApps(Array.from(manifests.values()), {
      version: "0.0.1",
      platform: "mobile",
      branches,
    });
  }, [manifests, experimental]);
};
