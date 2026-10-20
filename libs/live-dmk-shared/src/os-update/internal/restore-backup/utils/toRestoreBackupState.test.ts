import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
import { DeviceSituation } from "../../shared/types";
import { toRestoreBackupState } from "./toRestoreBackupState";

describe("toRestoreBackupState", () => {
  describe("success", () => {
    it("should map a locked device to the locked restore state", () => {
      expect(toRestoreBackupState(DeviceSituation.LOCKED)).toEqual({
        type: RestoreBackupStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected restore state", () => {
      expect(toRestoreBackupState(DeviceSituation.DISCONNECTED)).toEqual({
        type: RestoreBackupStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should return a situation the mapping does not know", () => {
      const situation = "UNKNOWN" as DeviceSituation;

      expect(toRestoreBackupState(situation)).toBe(situation);
    });
  });
});
