import React from "react";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, type ScreenName } from "~/const";
import OsUpdateFlowScreen from "./index";

const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockListConnectedDevices = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset }),
}));
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useDeviceManagementKit: () => ({ listConnectedDevices: mockListConnectedDevices }),
}));

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OsUpdate>;
const props = {
  route: {
    params: {
      device: {
        id: "device-id",
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
        transport: rnBleTransportIdentifier,
      },
    },
  },
} as Props;
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "Release notes" },
} as OsUpdate;

const overrideInitialState = (state: State): State => ({
  ...state,
  deviceOsUpdate: { osUpdates: [osUpdate], hasBackup: false },
});

describe("OsUpdateFlowScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListConnectedDevices.mockReturnValue([{ sessionId: "session", type: "BLE" }]);
  });

  it("shows the What's new of the resolved update with the app markdown", () => {
    render(<OsUpdateFlowScreen {...props} />, { overrideInitialState });

    expect(screen.getByTestId("os-update-whats-new-screen")).toBeVisible();
    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("goes back when the What's new is closed", async () => {
    const { user } = render(<OsUpdateFlowScreen {...props} />, { overrideInitialState });

    await user.press(screen.getByTestId("os-update-whats-new-back-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("reconnects the device through My Ledger when its session is gone", () => {
    mockListConnectedDevices.mockReturnValue([]);

    render(<OsUpdateFlowScreen {...props} />, { overrideInitialState });

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: expect.arrayContaining([
          expect.objectContaining({
            name: NavigatorName.MyWallet,
            state: {
              routes: [
                expect.objectContaining({
                  params: {
                    device: {
                      deviceId: "device-id",
                      deviceName: "Ledger Stax",
                      modelId: "stax",
                      wired: false,
                    },
                  },
                }),
              ],
            },
          }),
        ]),
      }),
    );
  });
});
