import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { toProgress } from "./toProgress";

describe("toProgress", () => {
  describe("success", () => {
    it("should pair a pre-checks state with the pre-checks step", () => {
      expect(
        toProgress({
          currentStep: OsUpdatesSteps.PRE_CHECKS,
          currentState: { type: PreChecksStateType.DEVICE_LOCKED },
        }),
      ).toEqual({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.DEVICE_LOCKED },
      });
    });

    it("should pair a create-backup state with the create-backup step", () => {
      expect(
        toProgress({
          currentStep: OsUpdatesSteps.CREATE_BACKUP,
          currentState: { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
        }),
      ).toEqual({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
      });
    });
  });
});
