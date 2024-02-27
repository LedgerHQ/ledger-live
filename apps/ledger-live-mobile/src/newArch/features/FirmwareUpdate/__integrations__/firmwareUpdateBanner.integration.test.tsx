import * as React from "react";
import ReactNative from "react-native";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/devices";
import UpdateBanner from "../components/UpdateBanner";
import { State } from "~/reducers/types";
import { makeMockSettings } from "./shared";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn().mockReturnValue({ params: {} }),
  useNavigation: jest.fn().mockReturnValue({ navigate: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/device/hooks/useLatestFirmware", () => ({
  useLatestFirmware: jest.fn(),
}));
const { useLatestFirmware } = jest.requireMock(
  "@ledgerhq/live-common/device/hooks/useLatestFirmware",
);

jest.mock("../utils/navigateToNewUpdateFlow", () => ({
  navigateToNewUpdateFlow: jest.fn(),
}));

jest.mock("../utils/navigateToOldUpdateFlow", () => ({
  navigateToOldUpdateFlow: jest.fn(),
}));

const { navigateToNewUpdateFlow } = jest.requireMock("../utils/navigateToNewUpdateFlow");
const { navigateToOldUpdateFlow } = jest.requireMock("../utils/navigateToOldUpdateFlow");

describe("FirmwareUpdateBanner integration test", () => {
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
  });

  it("should not display the firmware update banner if there is no update", async () => {
    // TODO: write test
  });

  it("should not display the firmware update banner if onboarding has not been completed", async () => {
    // TODO: write test
  });

  it("should not display the firmware update banner if there is no connected device", async () => {
    // TODO: write test
  });

  it("should open the unsupported drawer if there is an update but it's iOS", async () => {
    // TODO: write test
    // "Firmware Update"
    // "Update your Ledger Nano firmware by connecting it to the Ledger Live application on desktop"
  });

  it("should open the unsupported drawer if there is an update and it's Android but the device has to be wired", async () => {
    // TODO: write test
    // "USB cable needed"
    // "To start the firmware update, plug your {{deviceName}} to your mobile phone using a USB cable.
  });

  it("should redirect to the OLD firmware update flow if the device is supported", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "2.0.0";
    const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano S to OS version mockVersion."),
    ).toBeOnTheScreen();
    expect(await screen.findByTestId("fw-update-banner")).toBeOnTheScreen();
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
  });

  it("should redirect to the NEW firmware update flow if the device is supported", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.stax;
    const mockDeviceVersion = "2.0.0";
    const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            deviceName: "mockDeviceName",
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update “mockDeviceName” to OS version mockVersion."),
    ).toBeOnTheScreen();
    expect(await screen.findByTestId("fw-update-banner")).toBeOnTheScreen();
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });
});
