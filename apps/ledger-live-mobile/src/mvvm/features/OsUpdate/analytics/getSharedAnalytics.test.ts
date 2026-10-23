import { DeviceModelId } from "@ledgerhq/types-devices";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { getSharedAnalytics } from "./getSharedAnalytics";
import { OsUpdateMode, OsUpdatePlatform, OsUpdateTransport } from "./types";

const modelId = DeviceModelId.stax;

describe("getSharedAnalytics", () => {
  it.each<
    [string, Parameters<typeof getSharedAnalytics>[0], ReturnType<typeof getSharedAnalytics>]
  >([
    [
      "an update over BLE",
      { modelId, wired: false },
      {
        platform: OsUpdatePlatform.LWM,
        modelId,
        transport: OsUpdateTransport.BLE,
        mode: OsUpdateMode.UPDATE,
      },
    ],
    [
      "a wired update with its update count",
      { modelId, wired: true, updateCount: 2 },
      {
        platform: OsUpdatePlatform.LWM,
        modelId,
        transport: OsUpdateTransport.USB,
        mode: OsUpdateMode.UPDATE,
        updateCount: 2,
      },
    ],
    [
      "a bootloader repair",
      { modelId, wired: false, mode: OsUpdateFlowMode.BOOTLOADER_REPAIR },
      {
        platform: OsUpdatePlatform.LWM,
        modelId,
        transport: OsUpdateTransport.BLE,
        mode: OsUpdateMode.BOOTLOADER_REPAIR,
      },
    ],
    [
      "a restore with no OS update",
      { modelId, wired: true, mode: OsUpdateFlowMode.RESTORE_BACKUP, updateCount: 0 },
      {
        platform: OsUpdatePlatform.LWM,
        modelId,
        transport: OsUpdateTransport.USB,
        mode: OsUpdateMode.RESTORE_BACKUP,
        updateCount: 0,
      },
    ],
  ])("returns the shared properties of %s", (_label, input, expected) => {
    expect(getSharedAnalytics(input)).toEqual(expected);
  });
});
