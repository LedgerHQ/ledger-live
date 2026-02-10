import React from "react";
import ReactNative from "react-native";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import UpdateBanner from ".";
import { makeOverrideInitialState } from "./__mocks__/makeOverrideInitialState";

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
const { navigateToNewUpdateFlow } = jest.requireMock("../../utils/navigateToNewUpdateFlow");

const NANO_S_DATA = {
  deviceModelId: DeviceModelId.nanoS,
  productName: getDeviceModel(DeviceModelId.nanoS).productName,
};
const NANO_X_DATA = {
  deviceModelId: DeviceModelId.nanoX,
  productName: getDeviceModel(DeviceModelId.nanoX).productName,
};
const NANO_SP_DATA = {
  deviceModelId: DeviceModelId.nanoSP,
  productName: getDeviceModel(DeviceModelId.nanoSP).productName,
};
const STAX_DATA = {
  deviceModelId: DeviceModelId.stax,
  productName: getDeviceModel(DeviceModelId.stax).productName,
};
const EUROPA_DATA = {
  deviceModelId: DeviceModelId.europa,
  productName: getDeviceModel(DeviceModelId.europa).productName,
};
const APEX_DATA = {
  deviceModelId: DeviceModelId.apex,
  productName: getDeviceModel(DeviceModelId.apex).productName,
};

const OUTDATED_NANOX_BLE_UPDATE = {
  deviceModelId: DeviceModelId.nanoX,
  productName: getDeviceModel(DeviceModelId.nanoX).productName,
  version: "2.3.0",
  fwVersion: "2.4.0",
  hasCompletedOnboarding: true,
  wired: false,
  hasConnectedDevice: true,
};

const updateFlowNotSupportedDataSet: Array<{
  deviceModelId: DeviceModelId;
  version: string;
  fwVersion: string;
  productName: string;
}> = [
  { ...NANO_S_DATA, version: "1.6.0", fwVersion: "1.7.0" },
  { ...NANO_X_DATA, version: "1.2.9", fwVersion: "1.3.0" },
];

const newUpdateFlowSupportedDataSet: Array<{
  deviceModelId: DeviceModelId;
  version: string;
  fwVersion: string;
  productName: string;
  wired: boolean;
}> = [
  { ...STAX_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: false },
  { ...STAX_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: true },
  { ...EUROPA_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: false },
  { ...EUROPA_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: true },
  { ...APEX_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: false },
  { ...APEX_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: true },
  { ...NANO_X_DATA, version: "2.4.0", fwVersion: "2.4.1", wired: true },
  { ...NANO_X_DATA, version: "2.4.0", fwVersion: "2.4.1", wired: false },
  { ...NANO_SP_DATA, version: "1.0.0", fwVersion: "1.1.0", wired: true },
  { ...NANO_S_DATA, version: "1.6.1", fwVersion: "1.7.2", wired: true },
];

describe.each([{ wallet40Enabled: true }, { wallet40Enabled: false }])(
  "<UpdateBanner /> when wallet40Enabled is $wallet40Enabled",
  ({ wallet40Enabled }) => {
    let PlatformSpy: jest.SpyInstance;
    beforeEach(() => {
      jest.restoreAllMocks();
      //Can't reset all mocks https://github.com/facebook/react-native/issues/42904
      navigateToNewUpdateFlow.mockClear();
      PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
    });

    const makeOverride = (args: Parameters<typeof makeOverrideInitialState>[0]) =>
      makeOverrideInitialState({ ...args, wallet40Enabled });

    it("should not display the firmware update banner if there is no update", async () => {
      useLatestFirmware.mockReturnValue(null);

      const mockDeviceModelId = DeviceModelId.nanoS;
      const mockDeviceVersion = "2.0.0";
      render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          deviceModelId: mockDeviceModelId,
          version: mockDeviceVersion,
          hasCompletedOnboarding: true,
          wired: true,
          hasConnectedDevice: true,
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
          version: "3.0.0",
        },
      });

      const mockDeviceModelId = DeviceModelId.nanoS;
      const mockDeviceVersion = "2.0.0";
      render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          deviceModelId: mockDeviceModelId,
          version: mockDeviceVersion,
          hasCompletedOnboarding: false, // Onboarding has not been completed
          wired: true,
          hasConnectedDevice: true,
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
          version: "3.0.0",
        },
      });

      const mockDeviceModelId = DeviceModelId.nanoS;
      const mockDeviceVersion = "2.0.0";
      render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          deviceModelId: mockDeviceModelId,
          version: mockDeviceVersion,
          hasCompletedOnboarding: true,
          wired: true,
          hasConnectedDevice: false, // No connected device
        }),
      });

      // Check that the banner is not displayed
      expect(await screen.queryByTestId("fw-update-banner")).toBeNull();
      expect(await screen.queryByTestId("OS update available")).toBeNull();
    });

    it("should open the unsupported drawer if there is an update but it's iOS on Nano X with version < 2.4.0", async () => {
      PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "ios" });
      useLatestFirmware.mockReturnValue({
        final: {
          name: "mockVersion",
          version: "3.0.0",
        },
      });

      const mockDeviceModelId = DeviceModelId.nanoX;
      const mockDeviceVersion = "2.0.0";
      const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          deviceModelId: mockDeviceModelId,
          version: mockDeviceVersion,
          hasCompletedOnboarding: true,
          wired: false,
          hasConnectedDevice: true,
        }),
      });

      // Check that the banner is displayed with the correct wording
      expect(await screen.findByText("OS update available")).toBeOnTheScreen();
      if (!wallet40Enabled) {
        expect(
          await screen.findByText("Tap to update your Ledger Nano X to OS version mockVersion."),
        ).toBeOnTheScreen();
      }

      // Press the banner
      await user.press(screen.getByTestId("fw-update-banner"));

      // Check that the unsupported drawer is displayed
      expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
      expect(
        await screen.findByText(
          "Update your Ledger Nano firmware by connecting it to the Ledger Wallet application on desktop",
        ),
      ).toBeOnTheScreen();

      // Check that the entrypoints to the update flows are not called
      expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
    });

    it("should open the unsupported drawer if there is a bluetooth update on Android on Nano X with version < 2.4.0", async () => {
      const { fwVersion, ...nanoX } = OUTDATED_NANOX_BLE_UPDATE;
      PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });
      useLatestFirmware.mockReturnValue({
        final: {
          name: "mockVersion",
          version: fwVersion,
        },
      });

      const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          ...nanoX,
        }),
      });

      // Check that the banner is displayed with the correct wording
      expect(await screen.findByText("OS update available")).toBeOnTheScreen();
      if (!wallet40Enabled) {
        expect(
          await screen.findByText("Tap to update your Ledger Nano X to OS version mockVersion."),
        ).toBeOnTheScreen();
      }

      // Press the banner
      await user.press(screen.getByTestId("fw-update-banner"));

      // Check that the unsupported drawer is displayed
      expect(await screen.findByText("USB cable needed")).toBeOnTheScreen();
      expect(
        await screen.findByText(
          "To start the firmware update, plug your Ledger Nano X to your mobile phone using a USB cable.",
        ),
      ).toBeOnTheScreen();

      // Check that the entrypoints to the update flows are not called
      expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
    });

    it("should open the unsupported drawer if there is a bluetooth update on iOS on Nano X with version < 2.4.0", async () => {
      const { fwVersion, ...nanoX } = OUTDATED_NANOX_BLE_UPDATE;
      PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "ios" });
      useLatestFirmware.mockReturnValue({
        final: {
          name: "mockVersion",
          version: fwVersion,
        },
      });

      const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          ...nanoX,
        }),
      });

      // Check that the banner is displayed with the correct wording
      expect(await screen.findByText("OS update available")).toBeOnTheScreen();
      if (!wallet40Enabled) {
        expect(
          await screen.findByText("Tap to update your Ledger Nano X to OS version mockVersion."),
        ).toBeOnTheScreen();
      }

      // Press the banner
      await user.press(screen.getByTestId("fw-update-banner"));

      // Check that the unsupported drawer is displayed
      expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
      expect(
        await screen.findByText(
          "Update your Ledger Nano firmware by connecting it to the Ledger Wallet application on desktop",
        ),
      ).toBeOnTheScreen();

      // Check that the entrypoints to the update flows are not called
      expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
    });

    it("should open the unsupported drawer if there is an update and it's Android but the device has to be wired", async () => {
      PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });
      useLatestFirmware.mockReturnValue({
        final: {
          name: "mockVersion",
          version: "3.0.0",
        },
      });

      const mockDeviceModelId = DeviceModelId.nanoS;
      const mockDeviceVersion = "2.0.0";
      const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
        overrideInitialState: makeOverride({
          deviceModelId: mockDeviceModelId,
          version: mockDeviceVersion,
          hasCompletedOnboarding: true,
          wired: false, // Device is not wired
          hasConnectedDevice: true,
        }),
      });

      // Check that the banner is displayed with the correct wording
      expect(await screen.findByText("OS update available")).toBeOnTheScreen();
      if (!wallet40Enabled) {
        expect(
          await screen.findByText("Tap to update your Ledger Nano S to OS version mockVersion."),
        ).toBeOnTheScreen();
      }

      // Press the banner
      await user.press(screen.getByTestId("fw-update-banner"));

      expect(await screen.findByText("USB cable needed")).toBeOnTheScreen();
      expect(
        await screen.findByText(
          "To start the firmware update, plug your Ledger Nano S to your mobile phone using a USB cable.",
        ),
      ).toBeOnTheScreen();

      // Check that the entrypoints to the update flows are not called
      expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
    });

    updateFlowNotSupportedDataSet.forEach(({ deviceModelId, version, productName, fwVersion }) => {
      it(`should open the unsupported drawer if there is an update and it's Android but the update is not supported for this device version (${version} ${deviceModelId})`, async () => {
        PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });
        useLatestFirmware.mockReturnValue({
          final: {
            name: "mockVersion",
            version: fwVersion,
          },
        });

        const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
          overrideInitialState: makeOverride({
            deviceModelId,
            version,
            hasCompletedOnboarding: true,
            wired: true, // Device is wired
            hasConnectedDevice: true,
          }),
        });

        // Check that the banner is displayed with the correct wording
        expect(await screen.findByText("OS update available")).toBeOnTheScreen();
        if (!wallet40Enabled) {
          expect(
            await screen.findByText(`Tap to update your ${productName} to OS version mockVersion.`),
          ).toBeOnTheScreen();
        }

        // Press the banner
        await user.press(screen.getByTestId("fw-update-banner"));

        // Check that the unsupported drawer is displayed
        expect(await screen.findByText("Firmware Update")).toBeOnTheScreen();
        expect(
          await screen.findByText(
            "Update your Ledger Nano firmware by connecting it to the Ledger Wallet application on desktop",
          ),
        ).toBeOnTheScreen();

        // Check that the entrypoints to the update flows are not called
        expect(navigateToNewUpdateFlow).not.toHaveBeenCalled();
      });
    });

    newUpdateFlowSupportedDataSet.forEach(
      ({ deviceModelId, version, productName, fwVersion, wired }) => {
        it(`should redirect to the NEW firmware update flow if the device is supported (${version} ${deviceModelId})`, async () => {
          PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });
          useLatestFirmware.mockReturnValue({
            final: {
              name: "mockVersion",
              version: fwVersion,
            },
          });

          const { user } = render(<UpdateBanner onBackFromUpdate={() => {}} />, {
            overrideInitialState: makeOverride({
              deviceModelId,
              version,
              hasCompletedOnboarding: true,
              wired,
              hasConnectedDevice: true,
            }),
          });

          // Check that the banner is displayed with the correct wording
          expect(await screen.findByText("OS update available")).toBeOnTheScreen();
          if (!wallet40Enabled) {
            expect(
              await screen.findByText(
                `Tap to update your ${productName} to OS version mockVersion.`,
              ),
            ).toBeOnTheScreen();
          }

          // Press the banner and check that the entrypoint to the new update flow is called
          await user.press(screen.getByTestId("fw-update-banner"));
          expect(navigateToNewUpdateFlow).toHaveBeenCalled();
        });
      },
    );
  },
);
