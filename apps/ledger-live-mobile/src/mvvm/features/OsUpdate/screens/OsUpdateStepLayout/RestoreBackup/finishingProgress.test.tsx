import React from "react";
import {
  OsUpdatesSteps,
  RestoreBackupStateType,
  RestoreBackupStatus,
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
const restoredWith = (restoreStatus: RestoreBackupStatus | undefined): RestoreBackupState => ({
  type: RestoreBackupStateType.BACKUP_RESTORED,
  restoreResult: restoreStatus && {
    restoreStatus,
    restoredLanguage: undefined,
    restoredCLS: undefined,
    restoredApps: undefined,
  },
});
const restored = restoredWith(undefined);
const RESTORED_TITLE = "Apps and settings reinstalled on your Ledger Stax";

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

  it.each([
    RestoreBackupStatus.FULL,
    RestoreBackupStatus.PARTIAL,
    RestoreBackupStatus.OUT_OF_MEMORY,
    undefined,
  ])(
    "fills the bar up to 100%% before showing the restored screen (restore: %s)",
    restoreStatus => {
      const { rerender } = render(element(restoring(0.8)));

      rerender(element(restoredWith(restoreStatus)));

      expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue.now).toBe(100);
      expect(screen.queryByText(RESTORED_TITLE)).toBeNull();

      act(() => {
        jest.advanceTimersByTime(FINISHING_ANIMATION_MS + 50);
      });

      expect(screen.getByText(RESTORED_TITLE)).toBeVisible();
    },
  );

  it("goes straight to the restored screen when no progress was ever shown", () => {
    render(element(restored));

    expect(screen.getByText(RESTORED_TITLE)).toBeVisible();
  });
});
