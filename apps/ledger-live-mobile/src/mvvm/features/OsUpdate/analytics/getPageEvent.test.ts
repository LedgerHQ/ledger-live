import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
  type OsUpdate,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { getPageEvent } from "./getPageEvent";
import {
  OsUpdateDeviceAction,
  OsUpdateFailureType,
  OsUpdateFlowStep,
  OsUpdatePage,
  OsUpdateRestoreStatus,
} from "./types";

const cancel = jest.fn();
const osUpdates = [
  { finalFirmware: { version: "1.5.0" } },
  { finalFirmware: { version: "1.8.0" } },
] as OsUpdate[];

const backupRestored = (restoreResult: unknown): OsUpdatesProgress =>
  ({
    step: OsUpdatesSteps.RESTORE_BACKUP,
    state: { type: RestoreBackupStateType.BACKUP_RESTORED, restoreResult },
  }) as OsUpdatesProgress;
const app = (restoredApp: boolean, restoredAppStorage?: boolean) => ({
  appName: "Bitcoin",
  restoredApp,
  restoredAppStorage,
});

describe("getPageEvent", () => {
  it.each<[string, OsUpdatesProgress, ReturnType<typeof getPageEvent>]>([
    [
      "Preparing during the pre-checks",
      { step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } },
      { page: OsUpdatePage.PREPARING, step: OsUpdateFlowStep.PRE_CHECKS },
    ],
    [
      "Battery Low with the battery level",
      {
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.BATTERY_TOO_LOW, currentPercentage: 12, cancel },
      },
      { page: OsUpdatePage.BATTERY_LOW, batteryLevel: 12 },
    ],
    [
      "Preparing during the backup",
      { step: OsUpdatesSteps.CREATE_BACKUP, state: { type: CreateBackupStateType.LOADING } },
      { page: OsUpdatePage.PREPARING, step: OsUpdateFlowStep.CREATE_BACKUP },
    ],
    [
      "Existing Backup",
      {
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: {
          type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
          useExistingBackup: jest.fn(),
          createNewBackup: jest.fn(),
        },
      },
      { page: OsUpdatePage.EXISTING_BACKUP },
    ],
    [
      "Secure Connection Refused",
      {
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: {
          type: CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: jest.fn(),
          cancel,
        },
      },
      { page: OsUpdatePage.SECURE_CONNECTION_REFUSED, step: OsUpdateFlowStep.CREATE_BACKUP },
    ],
    [
      "Installing with the version of the update",
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: {
          type: ApplyUpdatesStateType.UPDATING,
          progress: 0.3,
          updateIndex: 2,
          updateCount: 2,
        },
      },
      {
        page: OsUpdatePage.INSTALLING,
        updateIndex: 2,
        updateCount: 2,
        osVersionTo: "1.8.0",
      },
    ],
    [
      "Continue On Device with the device action",
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE },
      },
      {
        page: OsUpdatePage.CONTINUE_ON_DEVICE,
        step: OsUpdateFlowStep.APPLY_UPDATES,
        deviceAction: OsUpdateDeviceAction.CONFIRM_LOAD_IMAGE,
      },
    ],
    [
      "Device Locked",
      { step: OsUpdatesSteps.APPLY_UPDATES, state: { type: ApplyUpdatesStateType.DEVICE_LOCKED } },
      { page: OsUpdatePage.DEVICE_LOCKED, step: OsUpdateFlowStep.APPLY_UPDATES },
    ],
    [
      "Restoring during an inline restore",
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.RESTORING, progress: 0.5 },
      },
      { page: OsUpdatePage.RESTORING },
    ],
    [
      "Error when the firmware install is refused",
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: {
          type: ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED,
          error: undefined,
          cancel,
        },
      },
      {
        page: OsUpdatePage.ERROR,
        step: OsUpdateFlowStep.APPLY_UPDATES,
        failureType: OsUpdateFailureType.INSTALL_FIRMWARE_REFUSED,
      },
    ],
    [
      "Restoring during a standalone restore",
      { step: OsUpdatesSteps.RESTORE_BACKUP, state: { type: RestoreBackupStateType.LOADING } },
      { page: OsUpdatePage.RESTORING },
    ],
    [
      "Error when out of memory",
      {
        step: OsUpdatesSteps.RESTORE_BACKUP,
        state: { type: RestoreBackupStateType.OUT_OF_MEMORY, error: undefined, cancel },
      },
      {
        page: OsUpdatePage.ERROR,
        step: OsUpdateFlowStep.RESTORE_BACKUP,
        failureType: OsUpdateFailureType.OUT_OF_MEMORY,
      },
    ],
    [
      "no new page while applying updates loads",
      { step: OsUpdatesSteps.APPLY_UPDATES, state: { type: ApplyUpdatesStateType.LOADING } },
      undefined,
    ],
  ])("returns %s", (_label, progress, expected) => {
    expect(getPageEvent(progress, osUpdates)).toEqual(expected);
  });

  it("leaves the version out when the update is not known", () => {
    expect(
      getPageEvent(
        {
          step: OsUpdatesSteps.APPLY_UPDATES,
          state: {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0,
            updateIndex: 1,
            updateCount: 1,
          },
        },
        [],
      ),
    ).not.toHaveProperty("osVersionTo");
  });

  describe("restoreStatus", () => {
    it.each([
      [
        OsUpdateRestoreStatus.FULL,
        "everything is restored",
        { restoredLanguage: true, restoredCLS: undefined, restoredApps: [app(true, true)] },
      ],
      [
        OsUpdateRestoreStatus.PARTIAL,
        "an app storage is not restored",
        { restoredLanguage: true, restoredCLS: true, restoredApps: [app(true, false)] },
      ],
      [
        OsUpdateRestoreStatus.PARTIAL,
        "only an app is restored, without its storage",
        { restoredLanguage: false, restoredCLS: false, restoredApps: [app(true, false)] },
      ],
      [
        OsUpdateRestoreStatus.NONE,
        "nothing is restored",
        { restoredLanguage: false, restoredCLS: false, restoredApps: [app(false)] },
      ],
      [OsUpdateRestoreStatus.NONE, "there is no restore result", undefined],
    ])("is %s when %s", (restoreStatus, _label, restoreResult) => {
      expect(getPageEvent(backupRestored(restoreResult), osUpdates)).toEqual({
        page: OsUpdatePage.SUCCESS,
        restoreStatus,
      });
    });

    it("is read from the updates applied state too", () => {
      expect(
        getPageEvent(
          {
            step: OsUpdatesSteps.APPLY_UPDATES,
            state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
          },
          osUpdates,
        ),
      ).toEqual({ page: OsUpdatePage.SUCCESS, restoreStatus: OsUpdateRestoreStatus.NONE });
    });
  });

  describe("subError", () => {
    const unexpectedError = (error: unknown): OsUpdatesProgress => ({
      step: OsUpdatesSteps.PRE_CHECKS,
      state: { type: PreChecksStateType.UNEXPECTED_ERROR, cancel, error },
    });

    it("is the DMK _tag of the error", () => {
      expect(
        getPageEvent(unexpectedError({ _tag: "DeviceLockedError", message: "secret" }), osUpdates),
      ).toEqual({
        page: OsUpdatePage.ERROR,
        step: OsUpdateFlowStep.PRE_CHECKS,
        failureType: OsUpdateFailureType.UNEXPECTED_ERROR,
        subError: "DeviceLockedError",
      });
    });

    it("is the name of an Error, never its message", () => {
      expect(getPageEvent(unexpectedError(new TypeError("secret")), osUpdates)).toEqual(
        expect.objectContaining({ subError: "TypeError" }),
      );
    });

    it("is left out when there is no error", () => {
      expect(
        getPageEvent(
          {
            step: OsUpdatesSteps.PRE_CHECKS,
            state: { type: PreChecksStateType.UNEXPECTED_ERROR, error: undefined, cancel },
          },
          osUpdates,
        ),
      ).not.toHaveProperty("subError");
    });
  });
});
