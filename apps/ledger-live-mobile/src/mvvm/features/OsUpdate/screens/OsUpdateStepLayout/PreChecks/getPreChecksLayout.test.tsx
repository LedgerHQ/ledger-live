import React from "react";
import { OsUpdatesSteps, PreChecksStateType, type PreChecksState } from "@ledgerhq/live-dmk-shared";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateStep } from "../../../components/OsUpdateStep";
import { stax } from "../../../testUtils/connectedDevice.mock";

function renderView(
  state: PreChecksState,
  { onClose = jest.fn(), isCloseConfirmationOpen = false } = {},
) {
  return render(
    <OsUpdateStep
      step={OsUpdatesSteps.PRE_CHECKS}
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

describe("PreChecks step", () => {
  it("shows the preparing screen without a sheet while pre-checks run", () => {
    renderView({ type: PreChecksStateType.LOADING });

    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    expect(isSheetRequested()).toBe(false);
  });

  it("asks to unlock the device when it is locked", () => {
    renderView({ type: PreChecksStateType.DEVICE_LOCKED });

    expect(screen.getByTestId("os-update-device-locked")).toBeVisible();
  });

  it("shows the disconnected state without any action", () => {
    renderView({ type: PreChecksStateType.DEVICE_DISCONNECTED });

    expect(screen.getByTestId("os-update-device-disconnected")).toBeVisible();
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("shows the battery percentage and cancels on press", async () => {
    const cancel = jest.fn();
    const { user } = renderView({
      type: PreChecksStateType.BATTERY_TOO_LOW,
      currentPercentage: 12,
      cancel,
    });

    expect(screen.getByText(/12%/)).toBeVisible();
    await user.press(screen.getByText("Cancel"));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels from the unexpected error state", async () => {
    const cancel = jest.fn();
    const { user } = renderView({ type: PreChecksStateType.UNEXPECTED_ERROR, cancel });

    await user.press(screen.getByText("Cancel"));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  describe("closing", () => {
    it("asks to close from the navigation bar", async () => {
      const onClose = jest.fn();
      const { user } = renderView({ type: PreChecksStateType.LOADING }, { onClose });

      await user.press(screen.getByTestId("os-update-close-button"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("requests its sheet while the close confirmation is closed", () => {
      renderView({ type: PreChecksStateType.DEVICE_LOCKED });

      expect(isSheetRequested()).toBe(true);
    });

    it("yields its sheet while the close confirmation is open", () => {
      renderView({ type: PreChecksStateType.DEVICE_LOCKED }, { isCloseConfirmationOpen: true });

      expect(isSheetRequested()).toBe(false);
    });
  });
});
