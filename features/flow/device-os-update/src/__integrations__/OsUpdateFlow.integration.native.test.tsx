// oxlint-disable typescript/consistent-type-assertions
import React, { createElement } from "react";
import { Text } from "react-native";
import { track, trackPage } from "@shared/analytics";
import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  type OsUpdatesOrchestratorProps,
  type OsUpdatesProgress,
} from "@features/platform-device-os-update";
import type * as PlatformDeviceOsUpdate from "@features/platform-device-os-update";
import { type OsUpdate } from "@domain/entity-device-os-update";
import type { OsUpdateDevice } from "../types/OsUpdateDevice";
import { act, createFakePorts, render, screen } from "../__tests__/render";
import { OsUpdateFlow } from "../screens/OsUpdateFlow/OsUpdateFlow";
import { stax } from "../utils/connectedDevice.mock";
import { OsUpdateButton, OsUpdateEvent, OsUpdatePage } from "../analytics/analyticsTypes";

const mockOnClose = jest.fn();
const mockOnReconnect = jest.fn();
let mockSetProgress: (progress: OsUpdatesProgress) => void = () => {};

// The orchestrator talks to the device: only its progress is faked, its steps are the real ones.
jest.mock("@features/platform-device-os-update", () => {
  const { createElement: h, Fragment, useState } = jest.requireActual<typeof React>("react");
  const actual = jest.requireActual<typeof PlatformDeviceOsUpdate>(
    "@features/platform-device-os-update",
  );
  return {
    ...actual,
    OsUpdatesOrchestrator: ({
      connectedDevice,
      renderStep,
      onStop,
      renderCloseConfirmation,
      onCompleted,
    }: OsUpdatesOrchestratorProps) => {
      const [osUpdatesProgress, setProgress] = useState<OsUpdatesProgress | null>(null);
      mockSetProgress = setProgress;
      const { stepProps, closeConfirmation } = actual.useOsUpdateSteps({
        osUpdatesProgress,
        connectedDevice,
        onStop,
        onCompleted,
        confirmClose: renderCloseConfirmation !== undefined,
      });
      return h(Fragment, null, renderStep(stepProps), renderCloseConfirmation?.(closeConfirmation));
    },
  };
});
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const device: OsUpdateDevice = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: DeviceModelId.STAX,
  wired: false,
};
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "Release notes" },
} as OsUpdate;

const renderFlow = (osUpdates: OsUpdate[]) =>
  render(<OsUpdateFlow device={device} onClose={mockOnClose} onReconnect={mockOnReconnect} />, {
    deviceOsUpdate: { osUpdates },
    ports: createFakePorts({
      dmk: { listConnectedDevices: () => [stax] } as unknown as DeviceManagementKit,
      renderReleaseNotes: markdown => createElement(Text, undefined, markdown),
    }),
  });

describe("OsUpdateFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the What's new of the resolved update", () => {
    renderFlow([osUpdate]);

    expect(screen.getByTestId("os-update-whats-new-screen")).toBeVisible();
    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("starts the orchestrator once the update is confirmed", async () => {
    const { user } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));

    expect(screen.queryByTestId("os-update-whats-new-screen")).toBeNull();
    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
  });

  it("only leaves the flow when the What's new is closed", async () => {
    const { user } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-back-button"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnReconnect).not.toHaveBeenCalled();
  });
});

const updating = (progress: number): OsUpdatesProgress => ({
  step: OsUpdatesSteps.APPLY_UPDATES,
  state: { type: ApplyUpdatesStateType.UPDATING, progress, updateIndex: 1, updateCount: 1 },
});

const outcomes = () =>
  jest
    .mocked(track)
    .mock.calls.filter(([event]) =>
      [OsUpdateEvent.COMPLETED, OsUpdateEvent.FAILED, OsUpdateEvent.ABORTED].includes(
        event as OsUpdateEvent,
      ),
    );

describe("OsUpdateFlow tracking", () => {
  const shared = { platform: "lwm", modelId: "stax", transport: "ble", mode: "update" };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks an update from What's New through Success", async () => {
    const { user, unmount } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.LOADING },
      }),
    );
    act(() => mockSetProgress(updating(0.4)));
    // Full already: the success screen shows without filling up the bar.
    act(() => mockSetProgress(updating(1)));
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: {
          type: ApplyUpdatesStateType.UPDATES_APPLIED,
          osVersion: "2.0.0",
          restoreResult: undefined,
        },
      }),
    );
    await user.press(screen.getByText("Finish"));
    unmount();

    expect(jest.mocked(trackPage).mock.calls.map(([{ category }]) => category)).toEqual([
      OsUpdatePage.WHATS_NEW,
      OsUpdatePage.PREPARING,
      OsUpdatePage.INSTALLING,
      OsUpdatePage.SUCCESS,
    ]);
    expect(jest.mocked(track).mock.calls).toEqual([
      [
        "button_clicked",
        expect.objectContaining({ button: OsUpdateButton.START, page: OsUpdatePage.WHATS_NEW }),
      ],
      [
        OsUpdateEvent.STARTED,
        { page: OsUpdatePage.WHATS_NEW, osVersionTo: "1.8.0", ...shared, updateCount: 1 },
      ],
      [
        OsUpdateEvent.COMPLETED,
        expect.objectContaining({
          page: OsUpdatePage.SUCCESS,
          osVersionTo: "1.8.0",
          restoreStatus: "none",
        }),
      ],
      [
        "button_clicked",
        expect.objectContaining({ button: OsUpdateButton.FINISH, page: OsUpdatePage.SUCCESS }),
      ],
    ]);
  });

  it("fails when the update is closed from the confirmation opened on an error", async () => {
    const { user, unmount } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));
    act(() => mockSetProgress(updating(0.4)));
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: {
          type: ApplyUpdatesStateType.UNEXPECTED_ERROR,
          error: new TypeError("boom"),
          cancel: jest.fn(),
        },
      }),
    );
    await user.press(screen.getByTestId("os-update-close-button"));
    // Leaving resets the navigation, which unmounts the screen while the confirmation is still open.
    mockOnReconnect.mockImplementationOnce(() => unmount());
    await user.press(screen.getByTestId("os-update-close-confirmation-cancel"));

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.FAILED,
        expect.objectContaining({
          page: OsUpdatePage.ERROR,
          step: "applyUpdates",
          failureType: "UnexpectedError",
          subError: "TypeError",
        }),
      ],
    ]);
  });

  it("completes when it is closed while the bar fills up after the update", async () => {
    const { user, unmount } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));
    act(() => mockSetProgress(updating(0.4)));
    // Not full: the bar fills up before the Success page shows.
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: {
          type: ApplyUpdatesStateType.UPDATES_APPLIED,
          osVersion: "2.0.0",
          restoreResult: undefined,
        },
      }),
    );
    await user.press(screen.getByTestId("os-update-close-button"));
    unmount();

    expect(jest.mocked(trackPage)).not.toHaveBeenCalledWith(
      expect.objectContaining({ category: OsUpdatePage.SUCCESS }),
    );
    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.COMPLETED,
        expect.objectContaining({ page: OsUpdatePage.SUCCESS, restoreStatus: "none" }),
      ],
    ]);
  });

  it("tracks Preparing for each step, and the backup selection", async () => {
    const useExistingBackup = jest.fn();
    const { user } = renderFlow([osUpdate]);

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.LOADING },
      }),
    );
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: { type: CreateBackupStateType.LOADING },
      }),
    );
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: {
          type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
          backupCreatedAt: new Date(),
          useExistingBackup,
          createNewBackup: jest.fn(),
        },
      }),
    );
    await user.press(screen.getByTestId("os-update-use-existing-backup"));

    expect(
      jest.mocked(trackPage).mock.calls.map(([{ category, props }]) => [category, props]),
    ).toEqual([
      [OsUpdatePage.WHATS_NEW, expect.anything()],
      [OsUpdatePage.PREPARING, expect.objectContaining({ step: "preChecks" })],
      [OsUpdatePage.PREPARING, expect.objectContaining({ step: "createBackup" })],
      [OsUpdatePage.EXISTING_BACKUP, expect.anything()],
    ]);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: OsUpdateButton.USE_EXISTING_BACKUP,
        page: OsUpdatePage.EXISTING_BACKUP,
      }),
    );
    expect(useExistingBackup).toHaveBeenCalledTimes(1);
  });
});
