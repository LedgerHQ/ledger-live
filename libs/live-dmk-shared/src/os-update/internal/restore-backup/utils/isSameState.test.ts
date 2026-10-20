import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
import { isSameState } from "./isSameState";

const noop = () => undefined;

describe("isSameState", () => {
  describe("success", () => {
    it("should return true when both states are the same type", () => {
      expect(
        isSameState(
          { type: RestoreBackupStateType.LOADING },
          { type: RestoreBackupStateType.LOADING },
        ),
      ).toBe(true);
    });

    it("should ignore the callbacks carried by a state", () => {
      expect(
        isSameState(
          { type: RestoreBackupStateType.OUT_OF_MEMORY, cancel: noop },
          { type: RestoreBackupStateType.OUT_OF_MEMORY, cancel: () => undefined },
        ),
      ).toBe(true);
    });

    it("should tell two restores at the same point apart from nothing", () => {
      expect(
        isSameState(
          { type: RestoreBackupStateType.RESTORING, progress: 0.4 },
          { type: RestoreBackupStateType.RESTORING, progress: 0.4 },
        ),
      ).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the state types differ", () => {
      expect(
        isSameState(
          { type: RestoreBackupStateType.LOADING },
          { type: RestoreBackupStateType.DEVICE_LOCKED },
        ),
      ).toBe(false);
    });

    it("should return false when the restore has moved on", () => {
      expect(
        isSameState(
          { type: RestoreBackupStateType.RESTORING, progress: 0.4 },
          { type: RestoreBackupStateType.RESTORING, progress: 0.5 },
        ),
      ).toBe(false);
    });
  });
});
