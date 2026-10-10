import React from "react";
import {
  OsUpdatesSteps,
  RestoreBackupStateType,
  type RestoreBackupState,
} from "@ledgerhq/live-dmk-shared";
import { act, render, screen } from "@tests/test-renderer";
import { FINISHING_ANIMATION_MS } from "../../UpdateProgressScreen/ProgressBar";
import { stax } from "../../../testUtils/connectedDevice.mock";
import { OsUpdateStep } from "../../../components/OsUpdateStep";

const restoring = (progress: number): RestoreBackupState => ({
  type: RestoreBackupStateType.RESTORING,
  progress,
});
const restored: RestoreBackupState = {
  type: RestoreBackupStateType.BACKUP_RESTORED,
  restoreResult: undefined,
};

const element = (state: RestoreBackupState) => (
  <OsUpdateStep
    step={OsUpdatesSteps.RESTORE_BACKUP}
    state={state}
    connectedDevice={stax}
    onUserClose={jest.fn()}
    isCloseConfirmationOpen={false}
  />
);

describe("RestoreBackup finishing progress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fills the bar up to 100% before showing the restored screen", () => {
    const { rerender } = render(element(restoring(0.8)));

    rerender(element(restored));

    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue.now).toBe(100);
    expect(screen.queryByText("Backup restored")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(FINISHING_ANIMATION_MS + 50);
    });

    expect(screen.getByText("Backup restored")).toBeVisible();
  });

  it("goes straight to the restored screen when no progress was ever shown", () => {
    render(element(restored));

    expect(screen.getByText("Backup restored")).toBeVisible();
  });
});
