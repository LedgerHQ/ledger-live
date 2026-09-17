import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { unexpectedErrorState } from "./unexpectedErrorState";

const cancel = () => undefined;

describe("unexpectedErrorState", () => {
  describe("success", () => {
    it("should return the pre-checks unexpected error state", () => {
      expect(unexpectedErrorState(OsUpdatesSteps.PRE_CHECKS, cancel)).toEqual({
        type: PreChecksStateType.UNEXPECTED_ERROR,
        cancel,
      });
    });

    it("should return the create-backup unexpected error state", () => {
      expect(unexpectedErrorState(OsUpdatesSteps.CREATE_BACKUP, cancel)).toEqual({
        type: CreateBackupStateType.UNEXPECTED_ERROR,
        cancel,
      });
    });
  });
});
