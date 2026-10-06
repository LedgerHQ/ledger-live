import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import DebugConnectNewDeviceScreen from "./ConnectNewDeviceScreen";

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

const mockedConnectNewDevice = jest.mocked(connectNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let emitState: ((state: ConnectNewDeviceUIState) => void) | undefined;

function lastUseCaseInput() {
  const { calls } = mockedConnectNewDevice.mock;
  return calls[calls.length - 1][0];
}

describe("DebugConnectNewDeviceScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    mockedConnectNewDevice.mockReturnValue({
      subscribe: jest.fn(({ next }) => {
        emitState = next;
        return { unsubscribe: jest.fn() };
      }),
    } as unknown as ReturnType<typeof connectNewDevice>);
  });

  it("should log the onDeviceNotFound, onConnected and onClose calls", async () => {
    // GIVEN
    const { user } = render(<DebugConnectNewDeviceScreen />);
    expect(screen.getByText("No callback called yet.")).toBeVisible();

    // WHEN
    act(() =>
      emitState?.({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [],
        showDeviceNotFound: true,
      }),
    );
    await user.press(screen.getByText("I don't see my device"));
    act(() =>
      lastUseCaseInput().onConnected({
        sessionId: "session-id",
        connectedDevice: { name: "Ledger Nano X", modelId: DMKDeviceModelId.NANO_X, type: "BLE" },
      } as DeviceConnectionResult),
    );
    act(() => lastUseCaseInput().onClose());

    // THEN
    expect(screen.getByText(/onDeviceNotFound$/)).toBeVisible();
    expect(
      screen.getByText(/onConnected Ledger Nano X \(nanoX, BLE\), session session-id$/),
    ).toBeVisible();
    expect(screen.getByText(/onClose$/)).toBeVisible();
  });

  it("should restart the flow with the delays from the inputs", async () => {
    // GIVEN
    const { user } = render(<DebugConnectNewDeviceScreen />);

    // WHEN
    await user.type(screen.getByTestId("connect-new-device-debug-not-found-delay"), "1000");
    await user.type(screen.getByTestId("connect-new-device-debug-success-delay"), "200");
    await user.press(screen.getByText("Restart"));

    // THEN
    expect(mockedConnectNewDevice).toHaveBeenCalledTimes(2);
    expect(lastUseCaseInput()).toEqual(
      expect.objectContaining({ deviceNotFoundDelay: 1000, successDelay: 200 }),
    );
  });
});
