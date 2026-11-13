import {
  RestoreStatus,
  type DeviceBackup,
  type DeviceOsUpdateState,
  type OsUpdate,
  type RestoreResult,
} from "./schema";

export function mockOsUpdate(overrides?: Partial<OsUpdate>): OsUpdate {
  return {
    osuFirmware: {
      id: 1,
      perso: "perso_11",
      hash: null,
      notes: "Release notes",
      firmware: "osu-firmware",
      firmwareKey: "osu-firmware-key",
      nextFinalFirmware: 2,
    },
    finalFirmware: {
      id: 2,
      perso: "perso_11",
      hash: null,
      version: "2.0.0",
      bytes: null,
      firmware: "final-firmware",
      firmwareKey: "final-firmware-key",
      mcuVersions: [],
    },
    shouldFlashMcu: false,
    ...overrides,
  };
}

export function mockDeviceOsUpdateState(
  overrides?: Partial<DeviceOsUpdateState>,
): DeviceOsUpdateState {
  return { osUpdates: [], hasBackup: false, ...overrides };
}

export function mockDeviceBackup(overrides?: Partial<DeviceBackup>): DeviceBackup {
  return {
    languageId: 0,
    installedApps: [{ appName: "Bitcoin", data: undefined }],
    clsHexImage: undefined,
    createdAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

export function mockRestoreResult(overrides?: Partial<RestoreResult>): RestoreResult {
  return {
    restoreStatus: RestoreStatus.full,
    restoredLanguage: true,
    restoredCLS: undefined,
    restoredApps: [{ appName: "Bitcoin", restoredApp: true, restoredAppStorage: undefined }],
    ...overrides,
  };
}
