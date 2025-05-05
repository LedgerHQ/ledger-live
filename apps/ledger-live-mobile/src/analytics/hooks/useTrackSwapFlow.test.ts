import { renderHook } from "@testing-library/react-native";
import { useTrackSwapFlow, UseTrackSwapFlow } from "./useTrackSwapFlow";
import { track } from "../segment";
import {
  CantOpenDevice,
  LockedDeviceError,
  TransportError,
  UserRefusedAllowManager,
  UserRefusedOnDevice,
  TransportRaceCondition,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

describe("useTrackSwapFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: false,
  };

  const defaultArgs: UseTrackSwapFlow = {
    location: HOOKS_TRACKING_LOCATIONS.swapFlow,
    device: deviceMock,
    requestOpenApp: null,
    isLocked: false,
    error: null,
    inWrongDeviceForAccount: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not track events if location is not 'Swap Flow'", () => {
    renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      // @ts-expect-error: forcing a wrong location for testing
      initialProps: { ...defaultArgs, location: "Other Location" },
    });
    expect(track).not.toHaveBeenCalled();
  });

  it("should track 'Secure Channel refused' when error is UserRefusedAllowManager", () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", error: new UserRefusedAllowManager() });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel refused",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it("should track 'Open app denied' when previous requestOpenApp exists and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
    });

    // @ts-expect-error: requestOpenApp is not null initially
    rerender({ ...defaultArgs, requestOpenApp: null, error: new UserRefusedOnDevice() });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it("should track 'Open app accepted' when previous requestOpenApp exists and then requestOpenApp becomes null without error", () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    // @ts-expect-error: requestOpenApp is not null initially
    rerender({ ...defaultArgs, requestOpenApp: null, error: null });

    expect(track).toHaveBeenCalledWith(
      "Open app accepted",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDevice = { ...deviceMock, wired: true };

    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, device: wiredDevice, requestOpenApp: "Bitcoin" },
    });

    rerender({
      ...defaultArgs,
      device: wiredDevice,
      // @ts-expect-error: requestOpenApp is not null initially
      requestOpenApp: null,
      error: new UserRefusedOnDevice(),
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Device locked" if isLocked is true', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", isLocked: true });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Device locked" if error is LockedDeviceError', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", error: new LockedDeviceError() });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Connection failed" if error is CantOpenDevice', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", error: new CantOpenDevice() });

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Transport error" if error is TransportError', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({
      ...defaultArgs,
      requestOpenApp: "Ethereum",
      error: new TransportError("test", "test"),
    });

    expect(track).toHaveBeenCalledWith(
      "Transport error",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Transport race condition" if error is CantOpenDevice', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({
      ...defaultArgs,
      requestOpenApp: "Ethereum",
      error: new TransportRaceCondition(),
    });

    expect(track).toHaveBeenCalledWith(
      "Transport race condition",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });

  it('should track "Wrong device association" when inWrongDeviceForAccount is provided', () => {
    const { rerender } = renderHook((props: UseTrackSwapFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({
      ...defaultArgs,
      requestOpenApp: "Ethereum",
      inWrongDeviceForAccount: { accountName: "Test Account" },
    });

    expect(track).toHaveBeenCalledWith(
      "Wrong device association",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Exchange",
      }),
    );
  });
});
