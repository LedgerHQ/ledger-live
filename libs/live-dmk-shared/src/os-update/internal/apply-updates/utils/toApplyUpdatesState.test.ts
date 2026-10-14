import { ApplyUpdatesStateType } from "../../../api/model/ApplyUpdatesState";
import { DeviceSituation } from "../../shared/types";
import { toApplyUpdatesState } from "./toApplyUpdatesState";

describe("toApplyUpdatesState", () => {
  describe("success", () => {
    it("should map a locked device to the locked apply-updates state", () => {
      expect(toApplyUpdatesState(DeviceSituation.LOCKED)).toEqual({
        type: ApplyUpdatesStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected apply-updates state", () => {
      expect(toApplyUpdatesState(DeviceSituation.DISCONNECTED)).toEqual({
        type: ApplyUpdatesStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should return a situation the mapping does not know", () => {
      const situation = "UNKNOWN" as DeviceSituation;

      expect(toApplyUpdatesState(situation)).toBe(situation);
    });
  });
});
