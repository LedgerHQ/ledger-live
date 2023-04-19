import { useCallback } from "react";
import type { Exec, ListAppsResult } from "@ledgerhq/live-common/apps/index";
import { useAppsRunner } from "@ledgerhq/live-common/apps/react";
import { execWithTransport } from "@ledgerhq/live-common/apps/hw";
import { isDashboardName } from "@ledgerhq/live-common/hw/isDashboardName";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import quitApp from "@ledgerhq/live-common/hw/quitApp";
import { concatMap, retry } from "rxjs/operators";
import { from, of, timer } from "rxjs";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";

export function useApps(
  listAppsRes: ListAppsResult,
  deviceId: string,
  appsToRestore?: string[],
) {
  // Nb Two device jobs are chained due to the BLE stack getting reset when we enter/exit,
  // an application. A reconnectable transport paradigm could simplify this.
  // The `retry` is present because some devices take longer to become available for BLE
  // connection than others.
  const exec: Exec = useCallback(
    (...args) =>
      withDevice(deviceId)(transport =>
        from(getAppAndVersion(transport)).pipe(
          concatMap(appAndVersion =>
            isDashboardName(appAndVersion.name)
              ? of(true)
              : from(quitApp(transport)),
          ),
        ),
      ).pipe(
        concatMap(alreadyInDashboard =>
          timer(alreadyInDashboard ? 0 : 2000).pipe(
            concatMap(_ =>
              withDevice(deviceId)(transport =>
                execWithTransport(transport)(...args),
              ).pipe(retry(3)),
            ),
          ),
        ),
      ),
    [deviceId],
  );

  return useAppsRunner(listAppsRes, exec, appsToRestore);
}
