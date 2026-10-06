import React, { useEffect } from "react";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { OsUpdatesOrchestratorComponent } from "@ledgerhq/live-common/os-update/components/OsUpdatesOrchestratorComponent";
import { useOsUpdatesOrchestrator } from "@ledgerhq/live-common/os-update/hooks/useOsUpdatesOrchestrator";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { osUpdatePlatformComponents } from ".";
import { stax } from "../../testUtils/connectedDevice.mock";

jest.mock("@ledgerhq/live-common/os-update/hooks/useOsUpdatesOrchestrator");

// Wraps the real sheet to observe whether it is requested to be open.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

// Counts how many times the persistent part of the layout is mounted.
const mounts = { navBar: 0 };
jest.mock("../../screens/OsUpdateStepLayout/OsUpdateNavBar", () => ({
  OsUpdateNavBar: () => {
    useEffect(() => {
      mounts.navBar += 1;
    }, []);
    return null;
  },
}));

// The step's sheet is the one with a header close button: the close confirmation has none.
const isSheetRequested = () => {
  const stepSheets = jest
    .mocked(QueuedBottomSheet)
    .mock.calls.map(([props]) => props)
    .filter(props => props.noCloseButton === false);

  return stepSheets[stepSheets.length - 1]?.isRequestingToBeOpened;
};

const input: OsUpdatesOrchestratorUseCaseInput = {
  dmk: {} as OsUpdatesOrchestratorUseCaseInput["dmk"],
  connectedDevice: stax,
  osUpdates: [],
  storage: {} as OsUpdatesOrchestratorUseCaseInput["storage"],
  onStop: jest.fn(),
};

const preChecksLocked: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.DEVICE_LOCKED },
};
const createBackupAllowing: OsUpdatesProgress = {
  step: OsUpdatesSteps.CREATE_BACKUP,
  state: { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
};
const applyUpdating: OsUpdatesProgress = {
  step: OsUpdatesSteps.APPLY_UPDATES,
  state: { type: ApplyUpdatesStateType.UPDATING, progress: 0.2, updateIndex: 1, updateCount: 2 },
};

describe("osUpdatePlatformComponents", () => {
  beforeEach(() => {
    mounts.navBar = 0;
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  it("injects the very same component for every step", () => {
    const {
      PreChecksComponent,
      CreateBackupComponent,
      ApplyUpdatesComponent,
      RestoreBackupComponent,
    } = osUpdatePlatformComponents;

    expect(
      new Set([
        PreChecksComponent,
        CreateBackupComponent,
        ApplyUpdatesComponent,
        RestoreBackupComponent,
      ]).size,
    ).toBe(1);
  });

  describe("when the orchestrator moves from one step to the next", () => {
    const renderAt = (progress: OsUpdatesProgress) => {
      jest.mocked(useOsUpdatesOrchestrator).mockReturnValue({ osUpdatesProgress: progress });
      return render(
        <OsUpdatesOrchestratorComponent
          {...input}
          platformComponents={osUpdatePlatformComponents}
        />,
      );
    };

    const moveTo = (
      rerender: ReturnType<typeof render>["rerender"],
      progress: OsUpdatesProgress,
    ) => {
      jest.mocked(useOsUpdatesOrchestrator).mockReturnValue({ osUpdatesProgress: progress });
      rerender(
        <OsUpdatesOrchestratorComponent
          {...input}
          platformComponents={osUpdatePlatformComponents}
        />,
      );
    };

    it("never unmounts the layout, and with it the bottom sheet", () => {
      const { rerender } = renderAt(preChecksLocked);

      moveTo(rerender, createBackupAllowing);
      moveTo(rerender, applyUpdating);

      expect(mounts.navBar).toBe(1);
    });

    it("closes the sheet that the previous step left open when the new state has none", () => {
      const { rerender } = renderAt(preChecksLocked);
      expect(isSheetRequested()).toBe(true);
      expect(screen.getByTestId("os-update-device-locked")).toBeVisible();

      moveTo(rerender, applyUpdating);

      expect(isSheetRequested()).toBe(false);
      expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    });

    it("keeps the sheet requested when the next step has a sheet of its own", () => {
      const { rerender } = renderAt(preChecksLocked);

      moveTo(rerender, createBackupAllowing);

      expect(isSheetRequested()).toBe(true);
      expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
      expect(screen.queryByTestId("os-update-device-locked")).toBeNull();
    });
  });
});
