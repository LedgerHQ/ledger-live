import { OsUpdateFlowMode } from "../types/OsUpdateFlowMode";
import { getSharedAnalytics } from "./getSharedAnalytics";
import { OsUpdateMode, OsUpdateTransport } from "./analyticsTypes";

const modelId = "stax";

describe("getSharedAnalytics", () => {
  it.each<
    [string, Parameters<typeof getSharedAnalytics>[0], ReturnType<typeof getSharedAnalytics>]
  >([
    [
      "an update over BLE",
      { modelId, wired: false },
      {
        platform: "lwm",
        modelId,
        transport: OsUpdateTransport.BLE,
        mode: OsUpdateMode.UPDATE,
      },
    ],
    [
      "a wired update with its update count",
      { modelId, wired: true, updateCount: 2 },
      {
        platform: "lwm",
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
        platform: "lwm",
        modelId,
        transport: OsUpdateTransport.BLE,
        mode: OsUpdateMode.BOOTLOADER_REPAIR,
      },
    ],
    [
      "a restore with no OS update",
      { modelId, wired: true, mode: OsUpdateFlowMode.RESTORE_BACKUP, updateCount: 0 },
      {
        platform: "lwm",
        modelId,
        transport: OsUpdateTransport.USB,
        mode: OsUpdateMode.RESTORE_BACKUP,
        updateCount: 0,
      },
    ],
  ])("returns the shared properties of %s", (_label, input, expected) => {
    expect(getSharedAnalytics(input)).toEqual(expected);
  });

  it("tracks the bootloader repair and restore modes under the flow mode values", () => {
    expect(OsUpdateMode.BOOTLOADER_REPAIR).toBe(OsUpdateFlowMode.BOOTLOADER_REPAIR);
    expect(OsUpdateMode.RESTORE_BACKUP).toBe(OsUpdateFlowMode.RESTORE_BACKUP);
  });
});
