import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { DeviceSituation } from "../../shared/types";
import { toCreateBackupState } from "./toCreateBackupState";

describe("toCreateBackupState", () => {
  describe("success", () => {
    it("should map a locked device to the locked create-backup state", () => {
      expect(toCreateBackupState({ situation: DeviceSituation.LOCKED })).toEqual({
        type: CreateBackupStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected create-backup state", () => {
      expect(toCreateBackupState({ situation: DeviceSituation.DISCONNECTED })).toEqual({
        type: CreateBackupStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should map a connection timeout to the timed-out create-backup state with its retry", () => {
      const retry = jest.fn();

      expect(
        toCreateBackupState({ situation: DeviceSituation.CONNECTION_TIMED_OUT, retry }),
      ).toEqual({
        type: CreateBackupStateType.CONNECTION_TIMED_OUT,
        retry,
      });
    });
  });
});
