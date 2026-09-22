import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { isSameState } from "./isSameState";

const noop = () => undefined;

describe("isSameState", () => {
  describe("success", () => {
    it("should return true when both states are the same type", () => {
      expect(
        isSameState(
          { type: CreateBackupStateType.LOADING },
          { type: CreateBackupStateType.LOADING },
        ),
      ).toBe(true);
      expect(
        isSameState(
          { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
          { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
        ),
      ).toBe(true);
    });

    it("should ignore the callbacks carried by a state", () => {
      expect(
        isSameState(
          {
            type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
            useExistingBackup: noop,
            createNewBackup: noop,
          },
          {
            type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
            useExistingBackup: () => undefined,
            createNewBackup: () => undefined,
          },
        ),
      ).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the state types differ", () => {
      expect(
        isSameState(
          { type: CreateBackupStateType.LOADING },
          { type: CreateBackupStateType.DEVICE_LOCKED },
        ),
      ).toBe(false);
    });
  });
});
