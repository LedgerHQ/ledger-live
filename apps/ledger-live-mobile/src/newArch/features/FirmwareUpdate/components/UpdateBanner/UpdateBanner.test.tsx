import * as React from "react";
import ReactNative from "react-native";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/devices";
import UpdateBanner from ".";
import { State } from "~/reducers/types";
import { makeMockSettings } from "./__mocks__/makeMockSettings";

// Mock react-navigation's useRoute and useNavigation
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn().mockReturnValue({ params: {} }),
  useNavigation: jest.fn().mockReturnValue({ navigate: jest.fn() }),
}));

// Mock useLatestFirmware
jest.mock("@ledgerhq/live-common/device/hooks/useLatestFirmware", () => ({
  useLatestFirmware: jest.fn(),
}));
const { useLatestFirmware } = jest.requireMock(
  "@ledgerhq/live-common/device/hooks/useLatestFirmware",
);

// Mock navigation to new and old update flows
jest.mock("../../utils/navigateToNewUpdateFlow", () => ({
  navigateToNewUpdateFlow: jest.fn(),
}));
jest.mock("../../utils/navigateToOldUpdateFlow", () => ({
  navigateToOldUpdateFlow: jest.fn(),
}));
const { navigateToNewUpdateFlow } = jest.requireMock("../../utils/navigateToNewUpdateFlow");
const { navigateToOldUpdateFlow } = jest.requireMock("../../utils/navigateToOldUpdateFlow");

describe("<UpdateBanner />", () => {
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
  });

  it("should not display the firmware update banner if there is no update", async () => {
    useLatestFirmware.mockReturnValue(null);

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "2.0.0";
    render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
            wired: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is not displayed
    expect(await screen.queryByTestId("fw-update-banner")).toBeNull();
    expect(await screen.queryByTestId("OS update available")).toBeNull();
  });

  it("should not display the firmware update banner if onboarding has not been completed", async () => {
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "2.0.0";
    render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: false, // Onboarding has not been completed
            wired: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is not displayed
    expect(await screen.queryByTestId("fw-update-banner")).toBeNull();
    expect(await screen.queryByTestId("OS update available")).toBeNull();
  });

  it("should not display the firmware update banner if there is no connected device", async () => {
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "2.0.0";
    render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
            wired: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: false, // No connected device
        },
      }),
    });

    // Check that the banner is not displayed
    expect(await screen.queryByTestId("fw-update-banner")).toBeNull();
    expect(await screen.queryByTestId("OS update available")).toBeNull();
  });

  it("should open the unsupported drawer if there is an update but it's iOS", async () => {
    PlatformSpy.mockReturnValue({ OS: "ios" } as typeof ReactNative.Platform);
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
            wired: true,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano S to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that it doesn't navigate to the update flow
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();

    // Check that the unsupported drawer is displayed
    expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
    expect(
      await screen.findByText(
        "Update your Ledger Nano firmware by connecting it to the Ledger Live application on desktop",
      ),
    ).toBeOnTheScreen();
  });

  it("should open the unsupported drawer if there is an update and it's Android but the device has to be wired", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoX;
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
            wired: false, // Device is not wired
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano X to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that the unsupported drawer is displayed
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
    expect(await screen.findByText("USB cable needed")).toBeOnTheScreen();
    expect(
      await screen.findByText(
        "To start the firmware update, plug your Ledger Nano X to your mobile phone using a USB cable.",
      ),
    ).toBeOnTheScreen();
  });

  it("should open the unsupported drawer if there is an update and it's Android but the update is not supported for this device version (nanoS <1.6.1)", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "1.6.0";
    const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
            wired: true, // Device is wired
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano S to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that it doesn't navigate to the update flow
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();

    // Check that the unsupported drawer is displayed
    expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
    expect(
      await screen.findByText(
        "Update your Ledger Nano firmware by connecting it to the Ledger Live application on desktop",
      ),
    ).toBeOnTheScreen();
  });

  it("should open the unsupported drawer if there is an update and it's Android but the update is not supported for this device version (nanoX <1.3.0)", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoX;
    const mockDeviceVersion = "1.2.9";
    const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
            wired: true, // Device is wired
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano X to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that it doesn't navigate to the update flow
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();

    // Check that the unsupported drawer is displayed
    expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
    expect(
      await screen.findByText(
        "Update your Ledger Nano firmware by connecting it to the Ledger Live application on desktop",
      ),
    ).toBeOnTheScreen();
  });

  it("should redirect to the OLD firmware update flow if the device is supported", async () => {
    PlatformSpy.mockReturnValue({ OS: "android" } as typeof ReactNative.Platform);
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });

    const mockDeviceModelId = DeviceModelId.nanoS;
    const mockDeviceVersion = "1.6.1";
    const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          ...makeMockSettings({
            modelId: mockDeviceModelId,
            version: mockDeviceVersion,
            hasCompletedOnboarding: true,
            wired: true, // Device is wired
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update your Ledger Nano S to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that the entrypoint to the old update flow is called
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
  });

  it("should redirect to the NEW firmware update flow if the device is supported", async () => {
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
            wired: false,
          }),
        },
        appstate: {
          ...state.appstate,
          hasConnectedDevice: true,
        },
      }),
    });

    // Check that the banner is displayed with the correct wording
    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update “mockDeviceName” to OS version mockVersion."),
    ).toBeOnTheScreen();

    // Press the banner and check that the entrypoint to the new update flow is called
    await user.press(screen.getByTestId("fw-update-banner"));
    expect(navigateToOldUpdateFlow).not.toHaveBeenCalled();
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });
});
