import { PreChecksStateMachineLastAction } from "../types";
import { resumeTarget } from "./resumeTarget";

describe("resumeTarget", () => {
  describe("success", () => {
    it("should resume waiting for the app and version from that last action", () => {
      expect(resumeTarget[PreChecksStateMachineLastAction.WaitForAppAndVersion]).toBe(
        "WaitingForAppAndVersion",
      );
    });

    it("should resume reading the battery from that last action", () => {
      expect(resumeTarget[PreChecksStateMachineLastAction.GetBatteryStatus]).toBe(
        "GetBatteryStatus",
      );
    });

    it("should cover every last action so a new one cannot be added without a resume target", () => {
      expect(Object.values(PreChecksStateMachineLastAction).sort()).toEqual(
        Object.keys(resumeTarget).sort(),
      );
    });
  });
});
