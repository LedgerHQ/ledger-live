import React from "react";
import {
  OsUpdatesSteps,
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "@ledgerhq/live-dmk-shared";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateStep } from "../../../components/OsUpdateStep";
import { stax } from "../../../testUtils/connectedDevice.mock";

function renderView(
  state: ApplyUpdatesState,
  { onClose = jest.fn(), isCloseConfirmationOpen = false } = {},
) {
  return render(
    <OsUpdateStep
      step={OsUpdatesSteps.APPLY_UPDATES}
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

describe("ApplyUpdates step", () => {
  it("never shows the preparing screen, and does nothing while loading", () => {
    renderView({ type: ApplyUpdatesStateType.LOADING });

    expect(screen.queryByTestId("os-update-preparing-screen")).toBeNull();
    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    expect(isSheetRequested()).toBe(false);
  });

  it("keeps the progress screen behind a sheet", () => {
    renderView({ type: ApplyUpdatesStateType.DEVICE_LOCKED });

    expect(screen.queryByTestId("os-update-preparing-screen")).toBeNull();
    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
  });

  it("shows the update progress with the update index and count", () => {
    renderView({
      type: ApplyUpdatesStateType.UPDATING,
      progress: 0.5,
      updateIndex: 2,
      updateCount: 3,
    });

    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    expect(screen.getByText("Updating your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Update 2 of 3")).toBeVisible();
    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue).toMatchObject({
      now: 50,
    });
  });

  it("hides the update index when the orchestrator reports a single update", () => {
    renderView({
      type: ApplyUpdatesStateType.UPDATING,
      progress: 0.5,
      updateIndex: 1,
      updateCount: 1,
    });

    expect(screen.getByTestId("os-update-progress-bar")).toBeVisible();
    expect(screen.queryByText(/Update \d+ of \d+/)).toBeNull();
  });

  it("shows the restore progress without an update count", () => {
    renderView({ type: ApplyUpdatesStateType.RESTORING, progress: 0.25 });

    expect(screen.getByText("Restoring your apps and settings")).toBeVisible();
    expect(screen.queryByText(/Update \d+ of \d+/)).toBeNull();
  });

  it("shows the summary once the updates are applied and closes on press", async () => {
    const onClose = jest.fn();
    const { user } = renderView(
      { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
      { onClose },
    );

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE,
    ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION,
    ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE,
    ApplyUpdatesStateType.AWAITING_GRANT_CONSENT,
    ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS,
    ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE,
    ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE,
  ] as const)("asks to continue on the device for %s", type => {
    renderView({ type });

    expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
  });

  it("offers retry and cancel when the secure connection is refused", async () => {
    const retry = jest.fn();
    const cancel = jest.fn();
    const { user } = renderView({
      type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
      retry,
      cancel,
    });

    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Cancel"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED, "os-update-install-firmware-refused"],
    [ApplyUpdatesStateType.OUT_OF_MEMORY, "os-update-out-of-memory"],
    [ApplyUpdatesStateType.UNEXPECTED_ERROR, "os-update-unexpected-error"],
  ] as const)("only offers cancel for %s", async (type, testID) => {
    const cancel = jest.fn();
    const { user } = renderView({ type, cancel });

    expect(screen.getByTestId(testID)).toBeVisible();
    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel"));

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [ApplyUpdatesStateType.DEVICE_LOCKED, "os-update-device-locked"],
    [ApplyUpdatesStateType.DEVICE_DISCONNECTED, "os-update-device-disconnected"],
  ] as const)("shows the recoverable %s state", (type, testID) => {
    renderView({ type });

    expect(screen.getByTestId(testID)).toBeVisible();
  });

  describe("closing", () => {
    it("asks to close from the navigation bar", async () => {
      const onClose = jest.fn();
      const { user } = renderView({ type: ApplyUpdatesStateType.LOADING }, { onClose });

      await user.press(screen.getByTestId("os-update-close-button"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("requests its sheet while the close confirmation is closed", () => {
      renderView({ type: ApplyUpdatesStateType.DEVICE_LOCKED });

      expect(isSheetRequested()).toBe(true);
    });

    it("yields its sheet while the close confirmation is open", () => {
      renderView({ type: ApplyUpdatesStateType.DEVICE_LOCKED }, { isCloseConfirmationOpen: true });

      expect(isSheetRequested()).toBe(false);
    });
  });
});
