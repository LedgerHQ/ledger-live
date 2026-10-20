import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import { render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import OsUpdateFlow from "../screens/OsUpdateFlow";
import { stax } from "../testUtils/connectedDevice.mock";

const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset }),
}));
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  useDeviceManagementKit: () => ({}),
  getActiveConnectedDevice: () => stax,
}));
// The orchestrator talks to the device: only its progress is faked.
jest.mock("@ledgerhq/live-common/os-update/hooks/useOsUpdatesOrchestrator", () => ({
  useOsUpdatesOrchestrator: () => ({ osUpdatesProgress: null }),
}));

const device: Device = { deviceId: "device-id", modelId: DeviceModelId.stax, wired: false };
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
