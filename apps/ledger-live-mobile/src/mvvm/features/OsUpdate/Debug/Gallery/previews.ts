import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
  type ApplyUpdatesState,
  type CreateBackupState,
  type OsUpdatesProgress,
  type PreChecksState,
  type RestoreBackupState,
} from "@features/platform-device-os-update";
import { RestoreStatus } from "@domain/entity-device-os-update";
import {
  noop,
  previewBackupCreatedAt,
  previewBatteryPercentage,
  previewError,
  previewTargetVersion,
  type ProgressPreset,
  type UpdateCount,
} from "./fixtures";

export type PreviewOptions = Readonly<{ updateCount: UpdateCount; progress: ProgressPreset }>;

export type Preview = Readonly<{ id: string; label: string }> &
  (
    | Readonly<{
        kind: "step";
        build: (options: PreviewOptions) => OsUpdatesProgress;
        isCloseConfirmationOpen?: boolean;
      }>
    | Readonly<{ kind: "whatsNew" }>
  );

export type PreviewGroup = Readonly<{ title: string; previews: readonly Preview[] }>;

const preChecks = (state: PreChecksState): OsUpdatesProgress => ({
  step: OsUpdatesSteps.PRE_CHECKS,
  state,
});
const createBackup = (state: CreateBackupState): OsUpdatesProgress => ({
  step: OsUpdatesSteps.CREATE_BACKUP,
  state,
});
const applyUpdates = (state: ApplyUpdatesState): OsUpdatesProgress => ({
  step: OsUpdatesSteps.APPLY_UPDATES,
  state,
});
const restoreBackup = (state: RestoreBackupState): OsUpdatesProgress => ({
  step: OsUpdatesSteps.RESTORE_BACKUP,
  state,
});

/** The progress screen the orchestrator shows right before any other apply-updates state. */
export const updatingProgress = ({ updateCount, progress }: PreviewOptions) =>
  applyUpdates({
    type: ApplyUpdatesStateType.UPDATING,
    progress,
    updateIndex: Math.min(2, updateCount),
    updateCount,
  });

/** The progress screen the orchestrator shows right before any other restore state. */
export const restoringProgress = ({ progress }: PreviewOptions) =>
  restoreBackup({ type: RestoreBackupStateType.RESTORING, progress });

export const restoreStatuses = [
  { status: RestoreStatus.full, id: "full", label: "full restore" },
  { status: RestoreStatus.partial, id: "partial", label: "partial restore" },
  { status: RestoreStatus.outOfMemory, id: "outOfMemory", label: "out of memory" },
] as const;

const restoreResult = (restoreStatus: RestoreStatus) => ({
  restoreStatus,
  restoredLanguage: undefined,
  restoredCLS: undefined,
  restoredApps: undefined,
});

const step = (
  id: string,
  label: string,
  build: (options: PreviewOptions) => OsUpdatesProgress,
): Preview => ({ id, label, kind: "step", build });

export const previewGroups: readonly PreviewGroup[] = [
  {
    title: "Intro",
    previews: [{ id: "whatsNew", label: "What's new", kind: "whatsNew" }],
  },
  {
    title: "Preparing",
    previews: [
      step("preChecks.loading", "Loading", () => preChecks({ type: PreChecksStateType.LOADING })),
      step("preChecks.locked", "Device locked", () =>
        preChecks({ type: PreChecksStateType.DEVICE_LOCKED }),
      ),
      step("preChecks.disconnected", "Disconnected", () =>
        preChecks({ type: PreChecksStateType.DEVICE_DISCONNECTED }),
      ),
      step("preChecks.timedOut", "Timed out", () =>
        preChecks({ type: PreChecksStateType.CONNECTION_TIMED_OUT, retry: noop, cancel: noop }),
      ),
      step("preChecks.battery", "Battery too low", () =>
        preChecks({
          type: PreChecksStateType.BATTERY_TOO_LOW,
          currentPercentage: previewBatteryPercentage,
          cancel: noop,
        }),
      ),
      step("preChecks.error", "Unexpected error", () =>
        preChecks({ type: PreChecksStateType.UNEXPECTED_ERROR, error: previewError, cancel: noop }),
      ),
    ],
  },
  {
    title: "Backup",
    previews: [
      step("createBackup.loading", "Loading", () =>
        createBackup({ type: CreateBackupStateType.LOADING }),
      ),
      step("createBackup.selection", "Backup selection", () =>
        createBackup({
          type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
          backupCreatedAt: previewBackupCreatedAt(),
          useExistingBackup: noop,
          createNewBackup: noop,
        }),
      ),
      step("createBackup.locked", "Device locked", () =>
        createBackup({ type: CreateBackupStateType.DEVICE_LOCKED }),
      ),
      step("createBackup.secureConnection", "Allow secure connection", () =>
        createBackup({ type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION }),
      ),
      step("createBackup.secureConnectionRefused", "Secure connection refused", () =>
        createBackup({
          type: CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("createBackup.disconnected", "Disconnected", () =>
        createBackup({ type: CreateBackupStateType.DEVICE_DISCONNECTED }),
      ),
      step("createBackup.timedOut", "Timed out", () =>
        createBackup({
          type: CreateBackupStateType.CONNECTION_TIMED_OUT,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("createBackup.error", "Unexpected error", () =>
        createBackup({
          type: CreateBackupStateType.UNEXPECTED_ERROR,
          error: previewError,
          cancel: noop,
        }),
      ),
    ],
  },
  {
    title: "Updating",
    previews: [
      step("applyUpdates.loading", "Loading", () =>
        applyUpdates({ type: ApplyUpdatesStateType.LOADING }),
      ),
      step("applyUpdates.updating", "Updating", updatingProgress),
      step("applyUpdates.restoring", "Restoring", ({ progress }) =>
        applyUpdates({ type: ApplyUpdatesStateType.RESTORING, progress }),
      ),
      ...restoreStatuses.map(({ status, id, label }) =>
        step(`applyUpdates.applied.${id}`, `Success: ${label}`, () =>
          applyUpdates({
            type: ApplyUpdatesStateType.UPDATES_APPLIED,
            osVersion: previewTargetVersion,
            restoreResult: restoreResult(status),
          }),
        ),
      ),
      step("applyUpdates.locked", "Device locked", () =>
        applyUpdates({ type: ApplyUpdatesStateType.DEVICE_LOCKED }),
      ),
      step("applyUpdates.updateComplete", "Awaiting update complete", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE }),
      ),
      step("applyUpdates.secureConnection", "Allow secure connection", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION }),
      ),
      step("applyUpdates.secureConnectionRefused", "Secure connection refused", () =>
        applyUpdates({
          type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("applyUpdates.installFirmware", "Allow install firmware", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE }),
      ),
      step("applyUpdates.installFirmwareRefused", "Install firmware refused", () =>
        applyUpdates({
          type: ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED,
          error: previewError,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("applyUpdates.grantConsent", "Grant consent", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_GRANT_CONSENT }),
      ),
      step("applyUpdates.listApps", "Allow list apps", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS }),
      ),
      step("applyUpdates.loadImage", "Confirm load image", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE }),
      ),
      step("applyUpdates.commitImage", "Confirm commit image", () =>
        applyUpdates({ type: ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE }),
      ),
      step("applyUpdates.disconnected", "Disconnected", () =>
        applyUpdates({ type: ApplyUpdatesStateType.DEVICE_DISCONNECTED }),
      ),
      step("applyUpdates.timedOut", "Timed out", () =>
        applyUpdates({
          type: ApplyUpdatesStateType.CONNECTION_TIMED_OUT,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("applyUpdates.error", "Unexpected error", () =>
        applyUpdates({
          type: ApplyUpdatesStateType.UNEXPECTED_ERROR,
          error: previewError,
          cancel: noop,
        }),
      ),
    ],
  },
  {
    title: "Restore only",
    previews: [
      step("restoreBackup.loading", "Loading", () =>
        restoreBackup({ type: RestoreBackupStateType.LOADING }),
      ),
      step("restoreBackup.restoring", "Restoring", restoringProgress),
      ...restoreStatuses.map(({ status, id, label }) =>
        step(`restoreBackup.restored.${id}`, `Success: ${label}`, () =>
          restoreBackup({
            type: RestoreBackupStateType.BACKUP_RESTORED,
            restoreResult: restoreResult(status),
          }),
        ),
      ),
      step("restoreBackup.locked", "Device locked", () =>
        restoreBackup({ type: RestoreBackupStateType.DEVICE_LOCKED }),
      ),
      step("restoreBackup.secureConnection", "Allow secure connection", () =>
        restoreBackup({ type: RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION }),
      ),
      step("restoreBackup.secureConnectionRefused", "Secure connection refused", () =>
        restoreBackup({
          type: RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("restoreBackup.grantConsent", "Grant consent", () =>
        restoreBackup({ type: RestoreBackupStateType.AWAITING_GRANT_CONSENT }),
      ),
      step("restoreBackup.listApps", "Allow list apps", () =>
        restoreBackup({ type: RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS }),
      ),
      step("restoreBackup.loadImage", "Confirm load image", () =>
        restoreBackup({ type: RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE }),
      ),
      step("restoreBackup.commitImage", "Confirm commit image", () =>
        restoreBackup({ type: RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE }),
      ),
      step("restoreBackup.disconnected", "Disconnected", () =>
        restoreBackup({ type: RestoreBackupStateType.DEVICE_DISCONNECTED }),
      ),
      step("restoreBackup.timedOut", "Timed out", () =>
        restoreBackup({
          type: RestoreBackupStateType.CONNECTION_TIMED_OUT,
          retry: noop,
          cancel: noop,
        }),
      ),
      step("restoreBackup.error", "Unexpected error", () =>
        restoreBackup({
          type: RestoreBackupStateType.UNEXPECTED_ERROR,
          error: previewError,
          cancel: noop,
        }),
      ),
    ],
  },
  {
    title: "Close",
    previews: [
      {
        id: "closeConfirmation",
        label: "Close confirmation",
        kind: "step",
        build: updatingProgress,
        isCloseConfirmationOpen: true,
      },
    ],
  },
];
