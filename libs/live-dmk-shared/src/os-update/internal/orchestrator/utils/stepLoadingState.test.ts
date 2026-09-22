import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
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
