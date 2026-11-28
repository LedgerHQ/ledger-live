import React, { useEffect } from "react";
import { act } from "@testing-library/react-native";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesOrchestrator,
  OsUpdatesOrchestratorUseCase,
  OsUpdatesSteps,
  PreChecksStateType,
  type OsUpdatesOrchestratorProps,
  type OsUpdatesProgress,
} from "@features/platform-device-os-update";
import { OsUpdateStep } from "./OsUpdateStep";
import { CloseConfirmation } from "../CloseConfirmation/CloseConfirmation";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "../../__tests__/render";
import { stax } from "../../utils/connectedDevice.mock";

// Stands in for the running orchestrator: `emit` pushes the next progress to the component.
let emit: (progress: OsUpdatesProgress) => void = () => {};
const runFrom = (initial: OsUpdatesProgress) =>
  jest.spyOn(OsUpdatesOrchestratorUseCase.prototype, "execute").mockReturnValue({
    start: () => emit(initial),
    stop: jest.fn(),
    subscribe: listener => {
      emit = listener;
      return { unsubscribe: jest.fn() };
    },
  });

// Wraps the real sheet to observe whether it is requested to be open.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

// Counts how many times the persistent part of the layout is mounted.
const mounts = { navBar: 0 };
jest.mock("../NavBar/OsUpdateNavBar", () => ({
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

const props: OsUpdatesOrchestratorProps = {
  dmk: {} as OsUpdatesOrchestratorProps["dmk"],
  connectedDevice: stax,
  osUpdates: [],
  backupStorage: {} as OsUpdatesOrchestratorProps["backupStorage"],
  renderStep: stepProps => <OsUpdateStep {...stepProps} />,
  onStop: jest.fn(),
  renderCloseConfirmation: closeProps => <CloseConfirmation {...closeProps} />,
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

const renderAt = (progress: OsUpdatesProgress) => {
  runFrom(progress);
  return render(<OsUpdatesOrchestrator {...props} />);
};

const moveTo = (progress: OsUpdatesProgress) => act(() => emit(progress));

describe("OsUpdateStep, rendered by the orchestrator", () => {
  beforeEach(() => {
    mounts.navBar = 0;
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  afterEach(() => {
    jest.mocked(OsUpdatesOrchestratorUseCase.prototype.execute).mockRestore();
  });

  describe("when the orchestrator moves from one step to the next", () => {
    it("never unmounts the layout, and with it the bottom sheet", () => {
      renderAt(preChecksLocked);

      moveTo(createBackupAllowing);
      moveTo(applyUpdating);

      expect(mounts.navBar).toBe(1);
    });

    it("closes the sheet that the previous step left open when the new state has none", () => {
      renderAt(preChecksLocked);
      expect(isSheetRequested()).toBe(true);
      expect(screen.getByTestId("os-update-device-locked")).toBeVisible();

      moveTo(applyUpdating);

      expect(isSheetRequested()).toBe(false);
      expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    });

    it("keeps the sheet requested when the next step has a sheet of its own", () => {
      renderAt(preChecksLocked);

      moveTo(createBackupAllowing);

      expect(isSheetRequested()).toBe(true);
      expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
      expect(screen.queryByTestId("os-update-device-locked")).toBeNull();
    });
  });
});
