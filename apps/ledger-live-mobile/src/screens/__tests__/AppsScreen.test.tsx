import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import AppsScreen from "../MyLedgerDevice/AppsScreen";
import { makeOverrideInitialState } from "LLM/features/FirmwareUpdate/components/UpdateBanner/__mocks__/makeOverrideInitialState";
import { ListAppsResult, State } from "@ledgerhq/live-common/apps/types";
import { getProductName } from "LLM/utils/getProductName";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

jest.mock("react-native-image-picker", () => ({}));
jest.mock("expo-keep-awake", () => ({}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn().mockReturnValue({ name: "MyLedgerDevice", params: {} }),
  useIsFocused: jest.fn().mockReturnValue(true),
}));

jest.mock("@ledgerhq/live-common/device/hooks/useLatestFirmware", () => ({
  useLatestFirmware: jest.fn(),
}));
const { useLatestFirmware } = jest.requireMock(
  "@ledgerhq/live-common/device/hooks/useLatestFirmware",
);

describe("<AppsScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLatestFirmware.mockReturnValue({
      final: { name: "mockVersion", version: "3.0.0" },
    });
  });

  describe.each([
    { wallet40Enabled: true, mainNavigation: true },
    { wallet40Enabled: false, mainNavigation: false },
  ])("when wallet40Enabled is $wallet40Enabled", ({ wallet40Enabled, mainNavigation }) => {
    const deviceInfo = aDeviceInfoBuilder({
      version: "2.0.0",
      isOSU: false,
    });

    const state = makeOverrideInitialState({
      deviceModelId: DeviceModelId.nanoS,
      version: "2.0.0",
      hasCompletedOnboarding: true,
      wired: true,
      hasConnectedDevice: true,
      lwmWallet40: {
        enabled: wallet40Enabled,
        params: { mainNavigation },
      },
    });
    const dispatch = jest.fn();
    const deviceId = DeviceModelId.nanoS;
    const initialDeviceName = getProductName(deviceId);
    const device = {
      deviceId: DeviceModelId.nanoS,
      deviceName: initialDeviceName,
      modelId: DeviceModelId.nanoS,
      wired: true,
    } as Device;

    it("should show firmware update banner when update is available", () => {
      const appState = {
        installQueue: ["Bitcoin"],
        install: [{ name: "Bitcoin", version: "1.0.0" }],
        uninstallQueue: [],
        updateAllQueue: [],
        recentlyInstalledApps: [],
        installed: [],
        apps: [],
        deviceInfo,
        deviceModel: getDeviceModel(DeviceModelId.nanoS),
      } as unknown as State;

      render(
        <AppsScreen
          state={appState}
          dispatch={dispatch}
          setStorageWarning={() => {}}
          deviceId={deviceId}
          initialDeviceName={initialDeviceName}
          pendingInstalls={false}
          deviceInfo={deviceInfo}
          device={device}
          tab={"INSTALLED_APPS"}
          optimisticState={appState}
          result={{} as ListAppsResult}
          onLanguageChange={() => {}}
          onBackFromUpdate={() => {}}
        />,
        {
          overrideInitialState: state,
        },
      );

      if (wallet40Enabled) {
        expect(screen.getByTestId("wallet40-firmware-update-banner")).toBeOnTheScreen();
      } else {
        expect(screen.getByTestId("firmware-update-banner")).toBeOnTheScreen();
      }
    });
  });
});
