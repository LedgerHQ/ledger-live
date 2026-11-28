import {
  DeviceBackupSchema,
  DeviceOsUpdateStateSchema,
  OsUpdateSchema,
  RestoreResultSchema,
  RestoreStatus,
} from "./schema";
import {
  mockDeviceBackup,
  mockDeviceOsUpdateState,
  mockOsUpdate,
  mockRestoreResult,
} from "./schema.mock";

describe("OsUpdateSchema", () => {
  it("accepts a resolved OS update", () => {
    expect(OsUpdateSchema.parse(mockOsUpdate())).toEqual(mockOsUpdate());
  });

  it("rejects an OS update without final firmware", () => {
    const { finalFirmware: _finalFirmware, ...withoutFinalFirmware } = mockOsUpdate();
    expect(OsUpdateSchema.safeParse(withoutFinalFirmware).success).toBe(false);
  });
});

describe("DeviceOsUpdateStateSchema", () => {
  it("accepts the state with updates and a backup", () => {
    const state = mockDeviceOsUpdateState({ osUpdates: [mockOsUpdate()], hasBackup: true });
    expect(DeviceOsUpdateStateSchema.parse(state)).toEqual(state);
  });
});

describe("DeviceBackupSchema", () => {
  it("accepts a backup", () => {
    const backup = mockDeviceBackup({
      installedApps: [{ appName: "Bitcoin", data: "0x0a1b" }],
      clsHexImage: "ff00",
    });
    expect(DeviceBackupSchema.parse(backup)).toEqual(backup);
  });

  it("rejects app data that is not a 0x-prefixed hexadecimal string", () => {
    const backup = mockDeviceBackup({ installedApps: [{ appName: "Bitcoin", data: "0xnothex" }] });
    expect(DeviceBackupSchema.safeParse(backup).success).toBe(false);
  });
});

describe("RestoreResultSchema", () => {
  it.each([RestoreStatus.full, RestoreStatus.partial, RestoreStatus.outOfMemory])(
    "accepts a %s restore",
    restoreStatus => {
      const result = mockRestoreResult({ restoreStatus });
      expect(RestoreResultSchema.parse(result)).toEqual(result);
    },
  );

  it("rejects an unknown restore status", () => {
    expect(
      RestoreResultSchema.safeParse({ ...mockRestoreResult(), restoreStatus: "none" }).success,
    ).toBe(false);
  });
});
