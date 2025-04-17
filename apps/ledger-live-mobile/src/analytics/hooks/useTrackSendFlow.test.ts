import { renderHook } from "@testing-library/react-native";
import { useTrackSendFlow, UseTrackSendFlow } from "./useTrackSendFlow";
import { track } from "../segment";
import {
  UserRefusedOnDevice,
  TransportRaceCondition,
  LockedDeviceError,
  CantOpenDevice,
  TransportError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

describe("useTrackSendFlow", () => {
  const deviceMock = {
    modelId: "nanoX",
    wired: false,
  };

  const defaultArgs: UseTrackSendFlow = {
    location: HOOKS_TRACKING_LOCATIONS.sendFlow,
    device: deviceMock,
    requestOpenApp: null,
    error: null,
    isLocked: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Open app denied' when requestOpenApp transitions to null and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
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
        page: "Send",
      }),
    );
  });

  it("should track 'Open app accepted' when requestOpenApp transitions to null without an error", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: null });

    expect(track).toHaveBeenCalledWith(
      "Open app accepted",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });

  it("should not track events if location is not 'Send Modal'", () => {
    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      //@ts-expect-error location is not 'Send Modal'
      initialProps: { ...defaultArgs, location: "Other Location" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
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
        page: "Send",
      }),
    );
  });

  it("should not track 'Open app accepted' or 'Open app denied' if requestOpenApp is not changed", () => {
    const initialArgs = { ...defaultArgs, requestOpenApp: "Ethereum", isLocked: false };

    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: initialArgs,
    });

    rerender({ ...initialArgs, requestOpenApp: "Ethereum" });

    expect(track).not.toHaveBeenCalled();
  });

  it("should track 'Transport race condition' when requestOpenApp transitions to null and error is TransportRaceCondition", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new TransportRaceCondition() });

    expect(track).toHaveBeenCalledWith(
      "Transport race condition",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });

  it("should track 'Connection failed' when requestOpenApp transitions to null and error is CantOpenDevice", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new CantOpenDevice() });

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });

  it("should track 'Transport error' when requestOpenApp transitions to null and error is TransportError", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new TransportError() });

    expect(track).toHaveBeenCalledWith(
      "Transport error",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });

  it("should track 'Device locked' when requestOpenApp transitions to null and error is LockedDeviceError", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new LockedDeviceError() });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });

  it("should track 'Device locked' when isLocked is true", () => {
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    //@ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, isLocked: true });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Send",
      }),
    );
  });
});
