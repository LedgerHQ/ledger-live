import React from "react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { act, fireEvent, render, screen, waitFor } from "tests/testSetup";
import { DeviceScreen } from "../index";
import { DEVICE_SCREEN_COLLAPSED_STORAGE_KEY } from "../useDeviceScreenViewModel";

const mockUseDeviceScreen = jest.fn();
const mockUseEnv = jest.fn();

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  useDeviceScreen: (live: boolean) => mockUseDeviceScreen(live),
}));

jest.mock("@features/platform-env", () => ({
  __esModule: true,
  default: (name: string) => mockUseEnv(name),
}));

const aDevice = (modelId: DeviceModelId) => ({ id: "device-1", modelId });

const anImageState = (input = { pressButton: jest.fn(), touch: jest.fn() }) => ({
  kind: "image" as const,
  src: "blob:screenshot",
  input,
});

describe("DeviceScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockUseEnv.mockReturnValue(true);
    mockUseDeviceScreen.mockReturnValue({
      device: aDevice(DeviceModelId.NANO_X),
      state: anImageState(),
    });
  });

  it("renders nothing when the mock server transport is off", () => {
    mockUseEnv.mockReturnValue(false);
    mockUseDeviceScreen.mockReturnValue({ device: null, state: { kind: "unavailable" } });

    render(<DeviceScreen />);

    expect(screen.queryByTestId("device-screen")).not.toBeInTheDocument();
  });

  it("renders nothing when no emulated device is connected", () => {
    mockUseDeviceScreen.mockReturnValue({ device: null, state: { kind: "unavailable" } });

    render(<DeviceScreen />);

    expect(screen.queryByTestId("device-screen")).not.toBeInTheDocument();
  });

  it("shows the screen and the button row for a button-driven device", () => {
    render(<DeviceScreen />);

    expect(screen.getByTestId("device-screen-image")).toBeInTheDocument();
    expect(screen.getByTestId("device-screen-button-left")).toBeInTheDocument();
    expect(screen.getByTestId("device-screen-button-both")).toBeInTheDocument();
    expect(screen.getByTestId("device-screen-button-right")).toBeInTheDocument();
  });

  it("shows no button row for a touchscreen device", () => {
    mockUseDeviceScreen.mockReturnValue({
      device: aDevice(DeviceModelId.STAX),
      state: anImageState(),
    });

    render(<DeviceScreen />);

    expect(screen.getByTestId("device-screen-image")).toBeInTheDocument();
    expect(screen.queryByTestId("device-screen-button-left")).not.toBeInTheDocument();
  });

  it("sends a button press and its release as separate actions", () => {
    const pressButton = jest.fn();
    mockUseDeviceScreen.mockReturnValue({
      device: aDevice(DeviceModelId.NANO_X),
      state: anImageState({ pressButton, touch: jest.fn() }),
    });

    render(<DeviceScreen />);
    const left = screen.getByTestId("device-screen-button-left");
    // jsdom does not implement pointer capture.
    left.setPointerCapture = jest.fn();

    fireEvent.pointerDown(left, { pointerId: 1 });
    expect(pressButton).toHaveBeenCalledWith("left", "press");

    fireEvent.pointerUp(left, { pointerId: 1 });
    expect(pressButton).toHaveBeenCalledWith("left", "release");
  });

  it("collapses to its header, stops polling, and persists the choice", async () => {
    render(<DeviceScreen />);

    expect(mockUseDeviceScreen).toHaveBeenLastCalledWith(true);

    act(() => {
      fireEvent.click(screen.getByTestId("device-screen-toggle"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("device-screen-image")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("device-screen-toggle")).toBeInTheDocument();
    expect(mockUseDeviceScreen).toHaveBeenLastCalledWith(false);
    expect(window.localStorage.getItem(DEVICE_SCREEN_COLLAPSED_STORAGE_KEY)).toBe("1");
  });

  it("falls back to the device record when no app is running", () => {
    mockUseDeviceScreen.mockReturnValue({
      device: aDevice(DeviceModelId.NANO_X),
      state: {
        kind: "os-info",
        device: {
          id: "device-1",
          name: "Ledger Nano X",
          device_type: "nanoX",
          connectivity_type: "USB",
          firmware_version: "2.2.3",
          apps: [{ name: "BOLOS", version: "1.4.0" }],
        },
      },
    });

    render(<DeviceScreen />);

    expect(screen.getByTestId("device-screen-os-info")).toBeInTheDocument();
    expect(screen.getByText("2.2.3")).toBeInTheDocument();
    expect(screen.queryByTestId("device-screen-image")).not.toBeInTheDocument();
  });

  it("surfaces a polling error", () => {
    mockUseDeviceScreen.mockReturnValue({
      device: aDevice(DeviceModelId.NANO_X),
      state: { kind: "error", message: "mock server unreachable" },
    });

    render(<DeviceScreen />);

    expect(screen.getByText("mock server unreachable")).toBeInTheDocument();
  });
});
