import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";
import { toRestoreBackupState } from "./toRestoreBackupState";

const cancel = jest.fn();

describe("toRestoreBackupState", () => {
  describe("success", () => {
    it("should map a locked device to the locked restore state", () => {
      expect(toRestoreBackupState({ situation: DeviceSituation.LOCKED }, cancel)).toEqual({
        type: RestoreBackupStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected restore state", () => {
      expect(toRestoreBackupState({ situation: DeviceSituation.DISCONNECTED }, cancel)).toEqual({
        type: RestoreBackupStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should map a connection timeout to the timed-out restore state with its retry and cancel", () => {
      const retry = jest.fn();

      expect(
        toRestoreBackupState({ situation: DeviceSituation.CONNECTION_TIMED_OUT, retry }, cancel),
      ).toEqual({
        type: RestoreBackupStateType.CONNECTION_TIMED_OUT,
        retry,
        cancel,
      });
    });

    it("should return a situation the mapping does not know", () => {
      const update = { situation: "UNKNOWN" } as unknown as DeviceSituationUpdate;

      expect(toRestoreBackupState(update, cancel)).toBe(update);
    });
  });
});
