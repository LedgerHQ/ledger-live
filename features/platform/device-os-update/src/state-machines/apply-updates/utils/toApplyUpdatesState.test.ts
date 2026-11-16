import { ApplyUpdatesStateType } from "../../../types/ApplyUpdatesState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";
import { toApplyUpdatesState } from "./toApplyUpdatesState";

const cancel = jest.fn();

describe("toApplyUpdatesState", () => {
  describe("success", () => {
    it("should map a locked device to the locked apply-updates state", () => {
      expect(toApplyUpdatesState({ situation: DeviceSituation.LOCKED }, cancel)).toEqual({
        type: ApplyUpdatesStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected apply-updates state", () => {
      expect(toApplyUpdatesState({ situation: DeviceSituation.DISCONNECTED }, cancel)).toEqual({
        type: ApplyUpdatesStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should map a connection timeout to the timed-out apply-updates state with its retry and cancel", () => {
      const retry = jest.fn();

      expect(
        toApplyUpdatesState({ situation: DeviceSituation.CONNECTION_TIMED_OUT, retry }, cancel),
      ).toEqual({
        type: ApplyUpdatesStateType.CONNECTION_TIMED_OUT,
        retry,
        cancel,
      });
    });

    it("should return a situation the mapping does not know", () => {
      const update = { situation: "UNKNOWN" } as unknown as DeviceSituationUpdate;

      expect(toApplyUpdatesState(update, cancel)).toBe(update);
    });
  });
});
