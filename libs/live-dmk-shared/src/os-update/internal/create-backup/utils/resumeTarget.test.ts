import { CreateBackupStateMachineLastAction } from "../types";
import { resumeTarget } from "./resumeTarget";

describe("resumeTarget", () => {
  describe("success", () => {
    it("should resume creating the backup from that last action", () => {
      expect(resumeTarget[CreateBackupStateMachineLastAction.CreateBackup]).toBe("CreateBackup");
    });

    it("should cover every last action so a new one cannot be added without a resume target", () => {
      expect(Object.values(CreateBackupStateMachineLastAction).sort()).toEqual(
        Object.keys(resumeTarget).sort(),
      );
    });
  });
});
