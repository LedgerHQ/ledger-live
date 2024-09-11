import { useCallback } from "react";
import type { Exec, ListAppsResult } from "@ledgerhq/live-common/apps/index";
import { useAppsRunner } from "@ledgerhq/live-common/apps/react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { execWithTransport } from "@ledgerhq/live-common/device/use-cases/execWithTransport";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  AppStorageType,
  StorageProvider,
} from "@ledgerhq/live-common/device/use-cases/appDataBackup/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export function useApps(
  listAppsRes: ListAppsResult,
  device: Device,
  storage: StorageProvider<AppStorageType>,
  appsToRestore?: string[],
) {
  const enableAppsBackup = useFeature("enableAppsBackup");

  const exec: Exec = useCallback(
    ({ skipAppDataBackup, ...args }) =>
      withDevice(device.deviceId)(transport =>
        execWithTransport(
          transport,
          enableAppsBackup?.enabled,
        )({ ...args, storage, modelId: device.modelId, skipAppDataBackup }),
      ),
    [device, enableAppsBackup, storage],
  );

  return useAppsRunner(listAppsRes, exec, storage, appsToRestore);
}
