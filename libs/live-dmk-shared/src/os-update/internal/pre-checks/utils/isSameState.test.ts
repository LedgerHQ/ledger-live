import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { isSameState } from "./isSameState";

const cancel = () => undefined;

describe("isSameState", () => {
  describe("success", () => {
    it("should return true when both states are the same non-battery type", () => {
      expect(
        isSameState({ type: PreChecksStateType.LOADING }, { type: PreChecksStateType.LOADING }),
      ).toBe(true);
      expect(
        isSameState(
          { type: PreChecksStateType.DEVICE_DISCONNECTED },
          { type: PreChecksStateType.DEVICE_DISCONNECTED },
        ),
      ).toBe(true);
    });

    it("should return true when battery-too-low percentages match", () => {
      expect(
        isSameState(
          { type: PreChecksStateType.BATTERY_TOO_LOW, currentPercentage: 10, cancel },
          { type: PreChecksStateType.BATTERY_TOO_LOW, currentPercentage: 10, cancel },
        ),
      ).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the state types differ", () => {
      expect(
        isSameState(
          { type: PreChecksStateType.LOADING },
          { type: PreChecksStateType.DEVICE_LOCKED },
        ),
      ).toBe(false);
    });

    it("should return false when battery-too-low percentages differ", () => {
      expect(
        isSameState(
          { type: PreChecksStateType.BATTERY_TOO_LOW, currentPercentage: 10, cancel },
          { type: PreChecksStateType.BATTERY_TOO_LOW, currentPercentage: 8, cancel },
        ),
      ).toBe(false);
    });
  });
});
