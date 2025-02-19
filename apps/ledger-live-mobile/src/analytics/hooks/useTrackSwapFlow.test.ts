import { renderHook } from "@testing-library/react-native";
import { useTrackSwapFlow, UseTrackAddAccountFlow } from "./useTrackSwapFlow";
import { track } from "../segment";
import { UserRefusedAllowManager, UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackSwapFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: false,
  };

  const defaultArgs: UseTrackAddAccountFlow = {
    location: HOOKS_TRACKING_LOCATIONS.swapFlow,
    device: deviceMock,
    requestOpenApp: null,
    error: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not track events if location is not 'Swap Flow'", () => {
    renderHook((props: UseTrackAddAccountFlow) => useTrackSwapFlow(props), {
      // @ts-expect-error: forcing a wrong location for testing
      initialProps: { ...defaultArgs, location: "Other Location" },
    });
    expect(track).not.toHaveBeenCalled();
  });

  it("should track 'Secure Channel refused' when error is UserRefusedAllowManager", () => {
    const { rerender } = renderHook((props: UseTrackAddAccountFlow) => useTrackSwapFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", error: new UserRefusedAllowManager() });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel refused",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });

  it("should track 'Open app denied' when previous requestOpenApp exists and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook((props: UseTrackAddAccountFlow) => useTrackSwapFlow(props), {
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
        page: "Ledger Sync",
      }),
    );
  });

  it("should track 'Open app accepted' when previous requestOpenApp exists and then requestOpenApp becomes null without error", () => {
    const { rerender } = renderHook((props: UseTrackAddAccountFlow) => useTrackSwapFlow(props), {
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
        page: "Ledger Sync",
      }),
    );
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDevice = { ...deviceMock, wired: true };

    const { rerender } = renderHook((props: UseTrackAddAccountFlow) => useTrackSwapFlow(props), {
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
        page: "Ledger Sync",
      }),
    );
  });
});
