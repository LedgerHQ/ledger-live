import { useCallback } from "react";
import type { Exec, ListAppsResult } from "@ledgerhq/live-common/lib/apps";
import { useAppsRunner } from "@ledgerhq/live-common/lib/apps/react";
import { execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";

export function useApps(
  listAppsRes: ListAppsResult,
  deviceId: string,
  appsToRestore?: string[],
) {
  const exec: Exec = useCallback(
    (...args) =>
      withDevice(deviceId)(transport => execWithTransport(transport)(...args)),
    [deviceId],
  );

  return useAppsRunner(listAppsRes, exec, appsToRestore);
}
