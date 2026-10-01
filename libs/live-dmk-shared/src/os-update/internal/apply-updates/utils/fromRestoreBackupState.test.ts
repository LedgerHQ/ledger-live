import { ApplyUpdatesStateType } from "../../../api/model/ApplyUpdatesState";
import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
import { fromRestoreBackupState } from "./fromRestoreBackupState";

const noop = () => undefined;

describe("fromRestoreBackupState", () => {
  describe("success", () => {
    it("should report the bar of the whole run rather than the one the restore reported", () => {
      expect(
        fromRestoreBackupState({ type: RestoreBackupStateType.RESTORING, progress: 0.5 }, 0.95),
      ).toEqual({
        type: ApplyUpdatesStateType.RESTORING,
        progress: 0.95,
      });
    });

    it.each([
      [RestoreBackupStateType.DEVICE_LOCKED, ApplyUpdatesStateType.DEVICE_LOCKED],
      [
        RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION,
        ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION,
      ],
      [RestoreBackupStateType.AWAITING_GRANT_CONSENT, ApplyUpdatesStateType.AWAITING_GRANT_CONSENT],
      [
        RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS,
        ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS,
      ],
      [
        RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE,
        ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE,
      ],
      [
        RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE,
        ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE,
      ],
      [RestoreBackupStateType.DEVICE_DISCONNECTED, ApplyUpdatesStateType.DEVICE_DISCONNECTED],
    ] as const)("should pass %s on as %s", (restoreState, expected) => {
      expect(fromRestoreBackupState({ type: restoreState }, 0)).toEqual({ type: expected });
    });

    it("should keep both callbacks the restore offered when the secure connection is refused", () => {
      expect(
        fromRestoreBackupState(
          {
            type: RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
            retry: noop,
            cancel: noop,
          },
          0,
        ),
      ).toEqual({
        type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
        retry: noop,
        cancel: noop,
      });
    });

    it("should keep the cancel the restore offered when the device runs out of room", () => {
      expect(
        fromRestoreBackupState({ type: RestoreBackupStateType.OUT_OF_MEMORY, cancel: noop }, 0),
      ).toEqual({
        type: ApplyUpdatesStateType.OUT_OF_MEMORY,
        cancel: noop,
      });
    });

    it("should keep the cancel the restore offered when it fails unexpectedly", () => {
      expect(
        fromRestoreBackupState({ type: RestoreBackupStateType.UNEXPECTED_ERROR, cancel: noop }, 0),
      ).toEqual({
        type: ApplyUpdatesStateType.UNEXPECTED_ERROR,
        cancel: noop,
      });
    });

    // The update is not over when the restore is, and the bar is already showing something.
    it("should drop what the update says for itself", () => {
      expect(fromRestoreBackupState({ type: RestoreBackupStateType.LOADING }, 0)).toBeNull();
      expect(
        fromRestoreBackupState(
          { type: RestoreBackupStateType.BACKUP_RESTORED, restoreResult: undefined },
          0,
        ),
      ).toBeNull();
    });
  });
});
