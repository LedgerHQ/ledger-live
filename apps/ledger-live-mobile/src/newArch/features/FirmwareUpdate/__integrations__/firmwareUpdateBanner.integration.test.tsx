import * as React from "react";
import ReactNative from "react-native";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import UpdateBanner from "../components/UpdateBanner";
import { DeviceModelId } from "@ledgerhq/devices";
import { State } from "~/reducers/types";
import { createStackNavigator } from "@react-navigation/stack";

const unsupportedButtonID = "fw-update-drawer-unsupported-close-btn";
const bannerID = "fw-update-banner";

const StubNavigator = createStackNavigator();

// "Firmware Update"
// "Update your Ledger Nano firmware by connecting it to the Ledger Live application on desktop"
// "USB cable needed"
// "To start the firmware update, plug your {{deviceName}} to your mobile phone using a USB cable.

// "OS update available"
// "Tap to update “{{deviceName}}” to OS version {{firmwareVersion}}."

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

// mockl navigateToFirmwareUpdateFlow
jest.mock("../utils/navigateToFirmwareUpdateFlow", () => ({
  navigateToFirmwareUpdateFlow: jest.fn(),
}));
const navigateToFirmwareUpdateFlowModule = jest.requireMock(
  "../utils/navigateToFirmwareUpdateFlow",
);

describe("FirmwareUpdateBanner integration test", () => {
  let PlatformSpy: jest.SpyInstance;
  let navigateToFirmwareUpdateFlowSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
    navigateToFirmwareUpdateFlowSpy = jest.spyOn(
      navigateToFirmwareUpdateFlowModule,
      "navigateToFirmwareUpdateFlow",
    );
  });
  it("should display the firmware update banner", async () => {
    useLatestFirmware.mockReturnValue({
      final: {
        name: "mockVersion",
      },
    });
    const { user } = render(
      <UpdateBanner onBackFromUpdate={() => {}} />,

      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            lastConnectedDevice: {
              modelId: DeviceModelId.nanoS,
              deviceName: "Nano S",
              version: "2.0.0",
              deviceId: "mockDeviceId",
              wired: true,
            },
            hasCompletedOnboarding: true,
          },
          appstate: {
            ...state.appstate,
            hasConnectedDevice: true,
          },
        }),
      },
    );

    expect(await screen.findByText("OS update available")).toBeOnTheScreen();
    expect(
      await screen.findByText("Tap to update “Nano S” to OS version mockVersion."),
    ).toBeOnTheScreen();
    expect(await screen.findByTestId(bannerID)).toBeOnTheScreen();
    await user.press(screen.getByTestId(bannerID));
    expect(navigateToFirmwareUpdateFlowSpy).toHaveBeenCalled();
    // await user.press(screen.getByTestId(unsupportedButtonID));
  });

  it("should not display the firmware update banner if there is no update", async () => {});
  it("should not display the firmware update banner if onboarding has not been completed", async () => {});
  it("should not display the firmware update banner if there is no connected device", async () => {});

  // it("should open the unsupported drawer if there is an update but it's iOS");
  // it(
  //   "should open the unsupported drawer if there is an update but it's Android and device has to be wired",
  // );
  // it(
  //   "should open the unsupported drawer if there is an update but it's Android and device has to be wired",
  // );
});
