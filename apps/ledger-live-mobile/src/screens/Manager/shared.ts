import { useCallback } from "react";
import { useAppsRunner } from "@ledgerhq/live-common/apps/react";
import { execWithTransport } from "@ledgerhq/live-common/apps/hw";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

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

  return useAppsRunner(listAppsRes, exec, appsToRestore, deviceId);
}
