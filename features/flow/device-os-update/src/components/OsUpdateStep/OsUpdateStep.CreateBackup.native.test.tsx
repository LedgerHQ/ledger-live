import React from "react";
import {
  OsUpdatesSteps,
  CreateBackupStateType,
  type CreateBackupState,
} from "@features/platform-device-os-update";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "../../__tests__/render";
import { OsUpdateStep } from "./OsUpdateStep";
import { stax } from "../../utils/connectedDevice.mock";

function renderView(
  state: CreateBackupState,
  { onClose = jest.fn(), isCloseConfirmationOpen = false } = {},
) {
  return render(
    <OsUpdateStep
      step={OsUpdatesSteps.CREATE_BACKUP}
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

const hasCloseButton = () => !jest.mocked(QueuedBottomSheet).mock.lastCall?.[0].noCloseButton;

describe("CreateBackup step", () => {
  it("shows the preparing screen without a sheet while loading", () => {
    renderView({ type: CreateBackupStateType.LOADING });

    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    expect(screen.queryByTestId("os-update-backup-selection")).toBeNull();
  });

  it("lets the user reuse the existing backup or create a new one", async () => {
    const useExistingBackup = jest.fn();
    const createNewBackup = jest.fn();
    const { user } = renderView({
      type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
      backupCreatedAt: new Date(2026, 8, 12, 0, 30),
      useExistingBackup,
      createNewBackup,
    });

    expect(hasCloseButton()).toBe(false);
    expect(screen.getByTestId("os-update-backup-selection-last-save")).toHaveTextContent(
      "Last saveSeptember 12, 12:30AM",
    );

    await user.press(screen.getByTestId("os-update-use-existing-backup"));
    await user.press(screen.getByTestId("os-update-create-new-backup"));

    expect(useExistingBackup).toHaveBeenCalledTimes(1);
    expect(createNewBackup).toHaveBeenCalledTimes(1);
  });

  it("asks to continue on the device while waiting for the secure connection", () => {
    renderView({ type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION });

    expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
  });

  it("offers retry and cancel when the secure connection is refused", async () => {
    const retry = jest.fn();
    const cancel = jest.fn();
    const { user } = renderView({
      type: CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
      retry,
      cancel,
    });

    expect(hasCloseButton()).toBe(false);

    await user.press(screen.getByText("Retry secure connection"));
    await user.press(screen.getByText("Cancel secure connection"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [CreateBackupStateType.DEVICE_LOCKED, "os-update-device-locked"],
    [CreateBackupStateType.DEVICE_DISCONNECTED, "os-update-device-disconnected"],
  ] as const)("shows the recoverable %s state", (type, testID) => {
    renderView({ type });

    expect(screen.getByTestId(testID)).toBeVisible();
  });

  it("restarts or cancels the update from the connection timeout", async () => {
    const retry = jest.fn();
    const cancel = jest.fn();
    const { user } = renderView({
      type: CreateBackupStateType.CONNECTION_TIMED_OUT,
      retry,
      cancel,
    });

    expect(screen.getByTestId("os-update-connection-timed-out")).toBeVisible();
    expect(hasCloseButton()).toBe(false);

    await user.press(screen.getByText("Restart OS update"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();

    await user.press(screen.getByText("Cancel OS update"));

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("cancels from the unexpected error state", async () => {
    const cancel = jest.fn();
    const { user } = renderView({
      type: CreateBackupStateType.UNEXPECTED_ERROR,
      error: new Error("boom"),
      cancel,
    });

    expect(hasCloseButton()).toBe(false);
    await user.press(screen.getByText("Cancel OS update"));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  describe("closing", () => {
    it("asks to close from the navigation bar", async () => {
      const onClose = jest.fn();
      const { user } = renderView({ type: CreateBackupStateType.LOADING }, { onClose });

      await user.press(screen.getByTestId("os-update-close-button"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("requests its sheet while the close confirmation is closed", () => {
      renderView({ type: CreateBackupStateType.DEVICE_LOCKED });

      expect(hasCloseButton()).toBe(true);

      expect(isSheetRequested()).toBe(true);
    });

    it("yields its sheet while the close confirmation is open", () => {
      renderView({ type: CreateBackupStateType.DEVICE_LOCKED }, { isCloseConfirmationOpen: true });

      expect(isSheetRequested()).toBe(false);
    });
  });
});
