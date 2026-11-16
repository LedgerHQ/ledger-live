import { OsUpdateFlowMode } from "../types/OsUpdateFlowMode";
import { OsUpdateMode, OsUpdateTransport, type OsUpdateSharedProperties } from "./analyticsTypes";
import { OS_UPDATE_ANALYTICS_PLATFORM } from "./analyticsPlatform";

type Input = Readonly<{
  modelId: string;
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
    platform: OS_UPDATE_ANALYTICS_PLATFORM,
    modelId,
    transport: wired ? OsUpdateTransport.USB : OsUpdateTransport.BLE,
    mode: getOsUpdateMode(mode),
    ...(updateCount === undefined ? {} : { updateCount }),
  };
}
