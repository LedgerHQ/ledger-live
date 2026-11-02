import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { unexpectedErrorState } from "./unexpectedErrorState";

const cancel = () => undefined;

describe("unexpectedErrorState", () => {
  describe("success", () => {
    it("should return the pre-checks unexpected error state", () => {
      const error = new Error("pre-checks crashed");
      expect(unexpectedErrorState(OsUpdatesSteps.PRE_CHECKS, cancel, error)).toEqual({
        type: PreChecksStateType.UNEXPECTED_ERROR,
        error,
        cancel,
      });
    });

    it("should return the create-backup unexpected error state", () => {
      const error = new Error("create-backup crashed");
      expect(unexpectedErrorState(OsUpdatesSteps.CREATE_BACKUP, cancel, error)).toEqual({
        type: CreateBackupStateType.UNEXPECTED_ERROR,
        error,
        cancel,
      });
    });
  });
});
