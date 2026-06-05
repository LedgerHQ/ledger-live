import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen, track } from "~/analytics";
import { SourceFlowProvider } from "../utils/SourceFlowContext";
import { PAGE_DEVICE_ACTION } from "../utils/trackDeviceIntent";
import { DeviceDisconnected } from "./DeviceDisconnected";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
    track: jest.fn(),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);

const device = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: DMKDeviceModelId.STAX,
  sessionId: "session-id",
  type: "BLE",
  transport: "ble",
} as ConnectedDevice;

function renderState(props: Partial<React.ComponentProps<typeof DeviceDisconnected>> = {}) {
  return render(
    <SourceFlowProvider value="my_ledger">
      <DeviceDisconnected device={device} onRetry={jest.fn()} onClose={jest.fn()} {...props} />
    </SourceFlowProvider>,
  );
}

describe("DeviceDisconnected", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description and the primary Retry / secondary Close CTAs", () => {
    renderState();

    expect(screen.getByTestId("device-intent-executor-device-disconnected")).toBeVisible();
    expect(screen.getByText("Device disconnected")).toBeVisible();
    expect(
      screen.getByText(
        "Your Ledger is no longer connected. Make sure it's powered on and within Bluetooth range or plugged in.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("invokes onRetry when the primary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = renderState({ onRetry, onClose });

    await user.press(screen.getByText("Retry"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.stax,
      transport: "ble",
      button: "Retry",
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invokes onClose when the secondary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = renderState({ onRetry, onClose });

    await user.press(screen.getByText("Close"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.stax,
      transport: "ble",
      button: "Close",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("fires the Device Action - Disconnected page event with sourceFlow, deviceUxV2, modelId and transport", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_DEVICE_ACTION.Disconnected,
        sourceFlow: "my_ledger",
        deviceUxV2: true,
        modelId: DeviceModelId.stax,
        transport: "ble",
      }),
      undefined,
    );
  });
});
