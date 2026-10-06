import React from "react";
import {
  OsUpdatesSteps,
  RestoreBackupStateType,
  type RestoreBackupState,
} from "@ledgerhq/live-dmk-shared";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateStep } from "../../../components/OsUpdateStep";
import { stax } from "../../../testUtils/connectedDevice.mock";

function renderView(
  state: RestoreBackupState,
  { onClose = jest.fn(), isCloseConfirmationOpen = false } = {},
) {
  return render(
    <OsUpdateStep
      step={OsUpdatesSteps.RESTORE_BACKUP}
      state={state}
      connectedDevice={stax}
      onUserClose={onClose}
      isCloseConfirmationOpen={isCloseConfirmationOpen}
    />,
  );
}

// Wraps the real sheet to observe whether the step requests it to be open.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const isSheetRequested = () =>
  jest.mocked(QueuedBottomSheet).mock.lastCall?.[0].isRequestingToBeOpened;

describe("RestoreBackup step", () => {
  it("never shows the preparing screen, and does nothing while loading", () => {
    renderView({ type: RestoreBackupStateType.LOADING });

    expect(screen.queryByTestId("os-update-preparing-screen")).toBeNull();
    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    expect(isSheetRequested()).toBe(false);
  });

  it("shows the restore progress", () => {
    renderView({ type: RestoreBackupStateType.RESTORING, progress: 0.4 });

    expect(screen.getByText("Restoring your apps and settings")).toBeVisible();
    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue).toMatchObject({
      now: 40,
    });
  });

  it("shows the restored summary and closes on press", async () => {
    const onClose = jest.fn();
    const { user } = renderView(
      { type: RestoreBackupStateType.BACKUP_RESTORED, restoreResult: undefined },
      { onClose },
    );

    expect(screen.getByText("Backup restored")).toBeVisible();
    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION,
    RestoreBackupStateType.AWAITING_GRANT_CONSENT,
    RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS,
    RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE,
    RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE,
  ] as const)("asks to continue on the device for %s", type => {
    renderView({ type });

    expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
  });

  it("offers retry and cancel when the secure connection is refused", async () => {
    const retry = jest.fn();
    const cancel = jest.fn();
    const { user } = renderView({
      type: RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
      retry,
      cancel,
    });

    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Cancel"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [RestoreBackupStateType.OUT_OF_MEMORY, "os-update-out-of-memory"],
    [RestoreBackupStateType.UNEXPECTED_ERROR, "os-update-unexpected-error"],
  ] as const)("only offers cancel for %s", async (type, testID) => {
    const cancel = jest.fn();
    const { user } = renderView({ type, cancel });

    expect(screen.getByTestId(testID)).toBeVisible();
    await user.press(screen.getByText("Cancel"));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [RestoreBackupStateType.DEVICE_LOCKED, "os-update-device-locked"],
    [RestoreBackupStateType.DEVICE_DISCONNECTED, "os-update-device-disconnected"],
  ] as const)("shows the recoverable %s state", (type, testID) => {
    renderView({ type });

    expect(screen.getByTestId(testID)).toBeVisible();
  });

  describe("closing", () => {
    it("asks to close from the navigation bar", async () => {
      const onClose = jest.fn();
      const { user } = renderView({ type: RestoreBackupStateType.LOADING }, { onClose });

      await user.press(screen.getByTestId("os-update-close-button"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("requests its sheet while the close confirmation is closed", () => {
      renderView({ type: RestoreBackupStateType.DEVICE_LOCKED });

      expect(isSheetRequested()).toBe(true);
    });

    it("yields its sheet while the close confirmation is open", () => {
      renderView({ type: RestoreBackupStateType.DEVICE_LOCKED }, { isCloseConfirmationOpen: true });

      expect(isSheetRequested()).toBe(false);
    });
  });
});
