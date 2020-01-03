// @flow
import { useCallback, createContext } from "react";
import type { ListAppsResult } from "@ledgerhq/live-common/lib/apps";
import { useAppsRunner } from "@ledgerhq/live-common/lib/apps";
import { execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";

export function useApps(listAppsRes: ListAppsResult, deviceId: string) {
  const exec = useCallback(
    (...a) =>
      withDevice(deviceId)(transport => execWithTransport(transport)(...a)),
    [deviceId],
  );

  return useAppsRunner(listAppsRes, exec);
}

export const ManagerContext = createContext();
