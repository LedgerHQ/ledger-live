import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { DeviceSituation } from "../../shared/types";
import { toCreateBackupState } from "./toCreateBackupState";

describe("toCreateBackupState", () => {
  describe("success", () => {
    it("should map a locked device to the locked create-backup state", () => {
      expect(toCreateBackupState(DeviceSituation.LOCKED)).toEqual({
        type: CreateBackupStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected create-backup state", () => {
      expect(toCreateBackupState(DeviceSituation.DISCONNECTED)).toEqual({
        type: CreateBackupStateType.DEVICE_DISCONNECTED,
      });
    });
  });
});
