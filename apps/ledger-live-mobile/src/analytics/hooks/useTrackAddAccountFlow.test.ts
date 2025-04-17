import { renderHook } from "@testing-library/react-native";
import { useTrackAddAccountFlow, UseTrackAddAccountFlow } from "./useTrackAddAccountFlow";
import { track } from "../segment";
import {
  UserRefusedOnDevice,
  CantOpenDevice,
  LockedDeviceError,
  TransportRaceCondition,
  TransportError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

describe("useTrackAddAccountFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: false,
  };

  const defaultArgs: UseTrackAddAccountFlow = {
    location: HOOKS_TRACKING_LOCATIONS.addAccount,
    device: deviceMock,
    requestOpenApp: null,
    allowOpeningGranted: null,
    isScanningForNewAccounts: null,
    error: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Open app denied' when requestOpenApp transitions to null and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook(
      (props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "SomeApp" },
      },
    );

    // @ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new UserRefusedOnDevice() });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );
  });

  it("should track both 'Device connection lost' (from allowOpeningGranted queue) and 'Connection failed' when allowOpeningGranted changes from true to false with error CantOpenDevice and scanning is inactive", () => {
    const { rerender } = renderHook(
      (props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props),
      {
        initialProps: { ...defaultArgs, allowOpeningGranted: true },
      },
    );

    rerender({ ...defaultArgs, allowOpeningGranted: false, error: new CantOpenDevice() });

    expect(track).toHaveBeenNthCalledWith(
      1,
      "Device connection lost",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );

    expect(track).toHaveBeenNthCalledWith(
      2,
      "Connection failed",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );
  });

  it("should track 'Device connection lost' when scanning for new accounts is active and error is CantOpenDevice", () => {
    renderHook((props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props), {
      initialProps: { ...defaultArgs, isScanningForNewAccounts: true, error: new CantOpenDevice() },
    });

    expect(track).toHaveBeenCalledWith(
      "Device connection lost",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );
  });

  it("should track 'Connection failed' when error is CantOpenDevice, scanning is inactive, and no allowOpeningGranted change triggers", () => {
    renderHook((props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props), {
      initialProps: { ...defaultArgs, error: new CantOpenDevice() },
    });

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );
  });

  it("should track 'Device locked' when previous allowOpeningGranted was true and error is LockedDeviceError", () => {
    const { rerender } = renderHook(
      (props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props),
      {
        initialProps: { ...defaultArgs, allowOpeningGranted: true },
      },
    );

    rerender({ ...defaultArgs, allowOpeningGranted: true, error: new LockedDeviceError() });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Add account",
      }),
    );
  });

  it("should not track any event if location is not 'Add account' or device information is missing", () => {
    renderHook((props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props), {
      initialProps: {
        ...defaultArgs,
        //@ts-expect-error location should come from HOOKS_TRACKING_LOCATIONS enum.
        location: "Other Location",
        device: { modelId: "", wired: false },
      },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it('should track "Transport race condition" if error is CantOpenDevice', () => {
    const { rerender } = renderHook(
      (props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
      },
    );

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
        page: "Add account",
      }),
    );
  });

  it('should track "Connection failed" if error is CantOpenDevice', () => {
    const { rerender } = renderHook(
      (props: UseTrackAddAccountFlow) => useTrackAddAccountFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
      },
    );

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
        page: "Add account",
      }),
    );
  });
});
