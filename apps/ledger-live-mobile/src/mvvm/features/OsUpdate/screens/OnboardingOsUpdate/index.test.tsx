import React from "react";
import { BackHandler } from "react-native";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import type { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import OnboardingOsUpdateScreen from "./index";

const mockListConnectedDevices = jest.fn();
const mockOnBackFromUpdate = jest.fn();

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useDeviceManagementKit: () => ({ listConnectedDevices: mockListConnectedDevices }),
}));

type Props = StackNavigatorProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingOsUpdate>;
const props = {
  route: {
    params: {
      device: { deviceId: "device-id", deviceName: "Ledger Stax", modelId: "stax", wired: false },
      onBackFromUpdate: mockOnBackFromUpdate,
    },
  },
} as unknown as Props;
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "Release notes" },
} as OsUpdate;

const overrideInitialState = (state: State): State => ({
  ...state,
  deviceOsUpdate: { osUpdates: [osUpdate], hasBackup: false },
});

describe("OnboardingOsUpdateScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListConnectedDevices.mockReturnValue([{ sessionId: "session", type: "BLE" }]);
  });

  it("shows the What's new of the resolved update", () => {
    render(<OnboardingOsUpdateScreen {...props} />, { overrideInitialState });

    expect(screen.getByTestId("os-update-whats-new-screen")).toBeVisible();
  });

  it("gives the early security check back as not completed when the What's new is closed", async () => {
    const { user } = render(<OnboardingOsUpdateScreen {...props} />, { overrideInitialState });

    await user.press(screen.getByTestId("os-update-whats-new-back-button"));

    expect(mockOnBackFromUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnBackFromUpdate).toHaveBeenCalledWith("start");
  });

  it("gives the early security check back as not completed when the device session is gone", () => {
    mockListConnectedDevices.mockReturnValue([]);

    render(<OnboardingOsUpdateScreen {...props} />, { overrideInitialState });

    expect(mockOnBackFromUpdate).toHaveBeenCalledWith("start");
  });

  it("gives the early security check back as not completed when there is no resolved update", () => {
    render(<OnboardingOsUpdateScreen {...props} />, {
      overrideInitialState: state => ({
        ...state,
        deviceOsUpdate: { osUpdates: [], hasBackup: false },
      }),
    });

    expect(mockOnBackFromUpdate).toHaveBeenCalledWith("start");
    expect(mockOnBackFromUpdate).not.toHaveBeenCalledWith("completed");
  });

  it("gives the early security check back as not completed on the Android back button", () => {
    const addEventListener = jest.spyOn(BackHandler, "addEventListener");
    render(<OnboardingOsUpdateScreen {...props} />, { overrideInitialState });
    const [, onHardwareBack] = addEventListener.mock.calls.find(
      ([eventName]) => eventName === "hardwareBackPress",
    ) ?? [undefined, undefined];

    expect(onHardwareBack?.()).toBe(true);
    expect(mockOnBackFromUpdate).toHaveBeenCalledWith("start");
    addEventListener.mockRestore();
  });
});
