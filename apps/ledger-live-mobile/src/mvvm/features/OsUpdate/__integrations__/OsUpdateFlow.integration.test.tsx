import React from "react";
import { track, trackPage } from "@shared/analytics";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  type Device,
  type OsUpdate,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { act, render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import OsUpdateFlow from "../screens/OsUpdateFlow";
import { stax } from "../testUtils/connectedDevice.mock";
import { OsUpdateButton, OsUpdateEvent, OsUpdatePage } from "../analytics/types";

const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset }),
}));
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  useDeviceManagementKit: () => ({}),
  getActiveConnectedDevice: () => stax,
  rnBleTransportIdentifier: "RN_BLE",
  rnHidTransportIdentifier: "RN_HID",
}));
let mockSetProgress: (progress: OsUpdatesProgress) => void = () => {};

// The orchestrator talks to the device: only its progress is faked.
jest.mock("@ledgerhq/live-common/os-update/hooks/useOsUpdatesOrchestrator", () => {
  const { useState } = jest.requireActual<typeof React>("react");
  return {
    useOsUpdatesOrchestrator: () => {
      const [osUpdatesProgress, setProgress] = useState<OsUpdatesProgress | null>(null);
      mockSetProgress = setProgress;
      return { osUpdatesProgress };
    },
  };
});
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const device: Device = {
  id: "device-id",
  name: "Ledger Stax",
  deviceModelId: DeviceModelId.stax,
  transport: rnBleTransportIdentifier,
};
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "Release notes" },
} as OsUpdate;

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OsUpdate>;
const props = { route: { params: { device } } } as Props;

const withOsUpdates = (osUpdates: OsUpdate[]) => ({
  overrideInitialState: (state: State): State => ({
    ...state,
    osUpdate: { osUpdates, hasBackup: false },
  }),
});

describe("OsUpdateFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the What's new of the resolved update", () => {
    render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

    expect(screen.getByTestId("os-update-whats-new-screen")).toBeVisible();
    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("starts the orchestrator once the update is confirmed", async () => {
    const { user } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));

    expect(screen.queryByTestId("os-update-whats-new-screen")).toBeNull();
    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
  });

  it("only goes back to My Ledger when the What's new is closed", async () => {
    const { user } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

    await user.press(screen.getByTestId("os-update-whats-new-back-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
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
  const shared = { platform: "lwm", modelId: DeviceModelId.stax, transport: "ble", mode: "update" };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks an update from What's New through Success", async () => {
    const { user, unmount } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

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
        state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
      }),
    );
    await user.press(screen.getByText("Close"));
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
        expect.objectContaining({ button: OsUpdateButton.CLOSE, page: OsUpdatePage.SUCCESS }),
      ],
    ]);
  });

  it("fails when the update is closed from the confirmation opened on an error", async () => {
    const { user, unmount } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

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
    mockReset.mockImplementationOnce(() => unmount());
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
    const { user, unmount } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

    await user.press(screen.getByTestId("os-update-whats-new-start-button"));
    act(() => mockSetProgress(updating(0.4)));
    // Not full: the bar fills up before the Success page shows.
    act(() =>
      mockSetProgress({
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
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
    const { user } = render(<OsUpdateFlow {...props} />, withOsUpdates([osUpdate]));

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
