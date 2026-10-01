import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
import { clampRestoreState } from "./clampRestoreState";

describe("clampRestoreState", () => {
  it("should leave a state that is not the bar untouched", () => {
    const locked = { type: RestoreBackupStateType.DEVICE_LOCKED } as const;

    expect(clampRestoreState(0.4, locked)).toBe(locked);
  });

  it("should keep a report that has moved on", () => {
    expect(
      clampRestoreState(0.4, { type: RestoreBackupStateType.RESTORING, progress: 0.5 }),
    ).toEqual({
      type: RestoreBackupStateType.RESTORING,
      progress: 0.5,
    });
  });

  it("should hold the bar when a later report is behind it", () => {
    expect(clampRestoreState(0.4, { type: RestoreBackupStateType.RESTORING, progress: 0 })).toEqual(
      {
        type: RestoreBackupStateType.RESTORING,
        progress: 0.4,
      },
    );
  });
});
