import type { DeviceModelId } from "@ledgerhq/devices";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import {
  OsUpdateMode,
  OsUpdatePlatform,
  OsUpdateTransport,
  type OsUpdateSharedProperties,
} from "./types";

type Input = Readonly<{
  modelId: DeviceModelId;
  wired: boolean;
  mode?: OsUpdateFlowMode;
  updateCount?: number;
}>;

function getOsUpdateMode(mode: OsUpdateFlowMode | undefined): OsUpdateMode {
  switch (mode) {
    case OsUpdateFlowMode.BOOTLOADER_REPAIR:
      return OsUpdateMode.BOOTLOADER_REPAIR;
    case OsUpdateFlowMode.RESTORE_BACKUP:
      return OsUpdateMode.RESTORE_BACKUP;
    case undefined:
      return OsUpdateMode.UPDATE;
    default: {
      const unhandled: never = mode;
      return unhandled;
    }
  }
}

export function getSharedAnalytics({
  modelId,
  wired,
  mode,
  updateCount,
}: Input): OsUpdateSharedProperties {
  return {
    platform: OsUpdatePlatform.LWM,
    modelId,
    transport: wired ? OsUpdateTransport.USB : OsUpdateTransport.BLE,
    mode: getOsUpdateMode(mode),
    ...(updateCount === undefined ? {} : { updateCount }),
  };
}
