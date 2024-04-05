import { useCallback } from "react";
import type { Exec, ListAppsResult } from "@ledgerhq/live-common/apps/index";
import { useAppsRunner } from "@ledgerhq/live-common/apps/react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { execWithTransport } from "@ledgerhq/live-common/device/use-cases/listAppsUseCase";

export function useApps(listAppsRes: ListAppsResult, deviceId: string, appsToRestore?: string[]) {
  const exec: Exec = useCallback(
    (...args) => withDevice(deviceId)(transport => execWithTransport(transport)(...args)),
    [deviceId],
  );

  return useAppsRunner(listAppsRes, exec, appsToRestore);
}
