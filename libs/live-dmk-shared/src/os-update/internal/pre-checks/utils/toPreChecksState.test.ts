import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { DeviceSituation } from "../../shared/types";
import { toPreChecksState } from "./toPreChecksState";

describe("toPreChecksState", () => {
  describe("success", () => {
    it("should map a locked device to the locked pre-checks state", () => {
      expect(toPreChecksState({ situation: DeviceSituation.LOCKED })).toEqual({
        type: PreChecksStateType.DEVICE_LOCKED,
      });
    });

    it("should map a disconnected device to the disconnected pre-checks state", () => {
      expect(toPreChecksState({ situation: DeviceSituation.DISCONNECTED })).toEqual({
        type: PreChecksStateType.DEVICE_DISCONNECTED,
      });
    });

    it("should map a connection timeout to the timed-out pre-checks state with its retry", () => {
      const retry = jest.fn();

      expect(toPreChecksState({ situation: DeviceSituation.CONNECTION_TIMED_OUT, retry })).toEqual({
        type: PreChecksStateType.CONNECTION_TIMED_OUT,
        retry,
      });
    });
  });
});
