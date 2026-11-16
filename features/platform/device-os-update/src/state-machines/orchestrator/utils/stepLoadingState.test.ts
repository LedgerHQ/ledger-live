import { CreateBackupStateType } from "../../../types/CreateBackupState";
import { OsUpdatesSteps } from "../../../types/OsUpdatesSteps";
import { PreChecksStateType } from "../../../types/PreChecksState";
import { stepLoadingState } from "./stepLoadingState";

describe("stepLoadingState", () => {
  describe("success", () => {
    it("should return the pre-checks loading state", () => {
      expect(stepLoadingState(OsUpdatesSteps.PRE_CHECKS)).toEqual({
        type: PreChecksStateType.LOADING,
      });
    });

    it("should return the create-backup loading state", () => {
      expect(stepLoadingState(OsUpdatesSteps.CREATE_BACKUP)).toEqual({
        type: CreateBackupStateType.LOADING,
      });
    });
  });
});
