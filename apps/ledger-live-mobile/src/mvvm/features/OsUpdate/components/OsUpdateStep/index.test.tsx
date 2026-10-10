import React, { type ComponentProps } from "react";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
} from "@ledgerhq/live-dmk-shared";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { stax } from "../../testUtils/connectedDevice.mock";
import { OsUpdateStep } from ".";

// Wraps the real sheet to observe whether the step requests it to be open.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const isSheetRequested = () =>
  jest.mocked(QueuedBottomSheet).mock.lastCall?.[0].isRequestingToBeOpened;

type Props = ComponentProps<typeof OsUpdateStep>;

const baseProps = {
  connectedDevice: stax,
  onUserClose: jest.fn(),
  isCloseConfirmationOpen: false,
};

const preChecks = (state: Extract<Props, { step: OsUpdatesSteps.PRE_CHECKS }>["state"]): Props => ({
  ...baseProps,
  step: OsUpdatesSteps.PRE_CHECKS,
  state,
});
const createBackup = (
  state: Extract<Props, { step: OsUpdatesSteps.CREATE_BACKUP }>["state"],
): Props => ({ ...baseProps, step: OsUpdatesSteps.CREATE_BACKUP, state });
const applyUpdates = (
  state: Extract<Props, { step: OsUpdatesSteps.APPLY_UPDATES }>["state"],
): Props => ({ ...baseProps, step: OsUpdatesSteps.APPLY_UPDATES, state });
const restoreBackup = (
  state: Extract<Props, { step: OsUpdatesSteps.RESTORE_BACKUP }>["state"],
): Props => ({ ...baseProps, step: OsUpdatesSteps.RESTORE_BACKUP, state });

describe("OsUpdateStep", () => {
  beforeEach(() => {
    jest.mocked(QueuedBottomSheet).mockClear();
    baseProps.onUserClose.mockClear();
  });

  describe("what each step shows", () => {
    it("shows the preparing screen for the pre-checks", () => {
      render(<OsUpdateStep {...preChecks({ type: PreChecksStateType.LOADING })} />);

      expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    });

    it("shows the preparing screen for the backup creation", () => {
      render(<OsUpdateStep {...createBackup({ type: CreateBackupStateType.LOADING })} />);

      expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    });

    it("shows the update progress while applying the updates", () => {
      render(
        <OsUpdateStep
          {...applyUpdates({
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.3,
            updateIndex: 1,
            updateCount: 2,
          })}
        />,
      );

      expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
      expect(screen.queryByTestId("os-update-preparing-screen")).toBeNull();
    });

    it("shows the restore progress while restoring the backup", () => {
      render(
        <OsUpdateStep
          {...restoreBackup({ type: RestoreBackupStateType.RESTORING, progress: 0.4 })}
        />,
      );

      expect(screen.getByText("Restoring your apps and settings")).toBeVisible();
    });
  });

  describe("the device", () => {
    it("names the product of the connected device in what it shows", () => {
      render(
        <OsUpdateStep
          {...applyUpdates({
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.3,
            updateIndex: 1,
            updateCount: 1,
          })}
        />,
      );

      expect(screen.getByText("Updating your Ledger Stax")).toBeVisible();
    });

    it("asks to unlock the connected device in a sheet", () => {
      render(<OsUpdateStep {...preChecks({ type: PreChecksStateType.DEVICE_LOCKED })} />);

      expect(screen.getByTestId("os-update-device-locked")).toBeVisible();
      expect(isSheetRequested()).toBe(true);
    });
  });

  describe("closing", () => {
    it("asks the user to close when the close button is pressed", () => {
      render(<OsUpdateStep {...preChecks({ type: PreChecksStateType.LOADING })} />);

      fireEvent.press(screen.getByTestId("os-update-close-button"));

      expect(baseProps.onUserClose).toHaveBeenCalledTimes(1);
    });

    it("hands the sheet over to the close confirmation while it is open", () => {
      const props = preChecks({ type: PreChecksStateType.DEVICE_LOCKED });
      const { rerender } = render(<OsUpdateStep {...props} />);
      expect(isSheetRequested()).toBe(true);

      rerender(<OsUpdateStep {...props} isCloseConfirmationOpen />);

      expect(isSheetRequested()).toBe(false);
    });

    it("lets the user close from the success screen once the updates are applied", () => {
      render(
        <OsUpdateStep
          {...applyUpdates({
            type: ApplyUpdatesStateType.UPDATES_APPLIED,
            restoreResult: undefined,
          })}
        />,
      );

      fireEvent.press(screen.getByText("Close"));

      expect(baseProps.onUserClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("moving from one step to the next", () => {
    it("closes the sheet of the previous step when the next one has none", () => {
      const { rerender } = render(
        <OsUpdateStep {...preChecks({ type: PreChecksStateType.DEVICE_LOCKED })} />,
      );
      expect(isSheetRequested()).toBe(true);

      rerender(
        <OsUpdateStep
          {...applyUpdates({
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.1,
            updateIndex: 1,
            updateCount: 1,
          })}
        />,
      );

      expect(isSheetRequested()).toBe(false);
      expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    });
  });
});
