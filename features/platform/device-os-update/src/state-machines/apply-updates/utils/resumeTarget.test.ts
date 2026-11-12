import { ApplyUpdatesStateMachineLastAction } from "../types";
import { resumeTarget } from "./resumeTarget";

describe("resumeTarget", () => {
  describe("success", () => {
    it("should resume each flash loop from the entry it was in, so its mode carries through", () => {
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.FlashMcu]).toBe("FlashMcu");
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.FlashMcuRecovery]).toBe(
        "FlashMcuRecovery",
      );
    });

    it("should resume a post-install wait from the wait, so a completed install is not run again", () => {
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.WaitForReadyAfterOsu]).toBe(
        "WaitForReadyAfterOsu",
      );
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFlash]).toBe(
        "WaitForReadyAfterFlash",
      );
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.WaitForReadyAfterRecoveryFlash]).toBe(
        "WaitForReadyAfterRecoveryFlash",
      );
      expect(resumeTarget[ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFinalInstall]).toBe(
        "WaitForReadyAfterFinalInstall",
      );
    });

    it("should cover every last action so a new one cannot be added without a resume target", () => {
      expect(Object.values(ApplyUpdatesStateMachineLastAction).sort()).toEqual(
        Object.keys(resumeTarget).sort(),
      );
    });
  });
});
