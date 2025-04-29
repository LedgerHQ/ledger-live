import { renderHook } from "@testing-library/react-native";
import { useTrackReceiveFlow, UseTrackReceiveFlow } from "./useTrackReceiveFlow";
import { track } from "../segment";
import {
  UserRefusedAddress,
  UserRefusedOnDevice,
  TransportRaceCondition,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

describe("useTrackReceiveFlow", () => {
  const deviceMock = {
    modelId: "nanoX",
    wired: false,
  };

  const defaultArgs: UseTrackReceiveFlow = {
    location: HOOKS_TRACKING_LOCATIONS.receiveFlow,
    device: deviceMock,
    requestOpenApp: null,
    inWrongDeviceForAccount: null,
    error: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Wrong device association' when inWrongDeviceForAccount is provided", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, inWrongDeviceForAccount: { accountName: "Test Account" } });

    expect(track).toHaveBeenCalledWith(
      "Wrong device association",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Open app denied' when requestOpenApp transitions to null and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new UserRefusedOnDevice() });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Address confirmation rejected' when error is UserRefusedAddress", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, error: new UserRefusedAddress() });

    expect(track).toHaveBeenCalledWith(
      "Address confirmation rejected",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should not track events if location is not 'Receive Modal'", () => {
    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      //@ts-expect-error location is not 'Receive Modal'
      initialProps: { ...defaultArgs, location: "Other Location" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, device: wiredDeviceMock, requestOpenApp: "Ethereum" },
    });

    rerender({
      ...defaultArgs,
      device: wiredDeviceMock,
      //@ts-expect-error requestOpenApp is not null
      requestOpenApp: null,
      error: new UserRefusedOnDevice(),
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Transport race condition' when error is TransportRaceCondition", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, error: new TransportRaceCondition() });

    expect(track).toHaveBeenCalledWith(
      "Transport race condition",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Connection failed' when error is CantOpenDevice", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, error: new CantOpenDevice() });

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Transport error' when error is TransportError", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, error: new TransportError("test", "test") });

    expect(track).toHaveBeenCalledWith(
      "Transport error",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Device locked' when error is LockedDeviceError", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, error: new LockedDeviceError() });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });

  it("should track 'Device locked' when isLocked is true", () => {
    const { rerender } = renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: defaultArgs,
    });

    rerender({ ...defaultArgs, isLocked: true });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Receive",
      }),
    );
  });
});
