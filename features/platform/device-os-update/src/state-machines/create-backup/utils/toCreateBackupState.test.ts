import { CreateBackupStateType } from "../../../types/CreateBackupState";
import { DeviceSituation } from "../../shared/types";
import { toCreateBackupState } from "./toCreateBackupState";

const cancel = jest.fn();

describe("toCreateBackupState", () => {
  describe("success", () => {
    it("should map a locked device to the locked create-backup state", () => {
      expect(toCreateBackupState({ situation: DeviceSituation.LOCKED }, cancel)).toEqual({
        type: CreateBackupStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected create-backup state", () => {
      expect(toCreateBackupState({ situation: DeviceSituation.DISCONNECTED }, cancel)).toEqual({
        type: CreateBackupStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should map a connection timeout to the timed-out create-backup state with its retry and cancel", () => {
      const retry = jest.fn();

      expect(
        toCreateBackupState({ situation: DeviceSituation.CONNECTION_TIMED_OUT, retry }, cancel),
      ).toEqual({
        type: CreateBackupStateType.CONNECTION_TIMED_OUT,
        retry,
        cancel,
      });
    });
  });
});
