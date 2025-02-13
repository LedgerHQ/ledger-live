import { renderHook } from "tests/testUtils";
import { useTrackExchangeFlow, UseTrackExchangeFlow } from "./useTrackExchangeFlow";
import { track } from "../segment";
import { UserRefusedAllowManager, UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackExchangeFlow", () => {
  const deviceMock = {
    modelId: "stax",
    wired: true,
  };

  const defaultArgs: UseTrackExchangeFlow = {
    location: HOOKS_TRACKING_LOCATIONS.exchange,
    device: deviceMock,
    error: null,
    isTrackingEnabled: true,
    isRequestOpenAppExchange: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Open app denied' when UserRefusedOnDevice error is thrown", () => {
    const error = new UserRefusedOnDevice();

    renderHook((props: UseTrackExchangeFlow) => useTrackExchangeFlow(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.exchange,
      }),
      true,
    );
  });

  it("should track 'Secure Channel denied' when UserRefusedAllowManager error is thrown", () => {
    const error = new UserRefusedAllowManager();

    renderHook((props: UseTrackExchangeFlow) => useTrackExchangeFlow(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel denied",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.exchange,
      }),
      true,
    );
  });

  it("should track 'Open app performed' when isRequestOpenAppExchange changes from true to false", () => {
    const { rerender } = renderHook((props: UseTrackExchangeFlow) => useTrackExchangeFlow(props), {
      initialProps: { ...defaultArgs, isRequestOpenAppExchange: true },
    });

    rerender({ ...defaultArgs, isRequestOpenAppExchange: false });

    expect(track).toHaveBeenCalledWith(
      "Open app performed",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.exchange,
      }),
      true,
    );
  });

  it("should not track events if location is not 'Exchange'", () => {
    renderHook((props: UseTrackExchangeFlow) => useTrackExchangeFlow(props), {
      //@ts-expect-error location is not 'Exchange'
      initialProps: { ...defaultArgs, location: "NOT Exchange" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should correctly determine connection type as 'BLE' when device.wired is false", () => {
    const bluetoothDeviceMock = { modelId: "stax", wired: false };

    const { rerender } = renderHook((props: UseTrackExchangeFlow) => useTrackExchangeFlow(props), {
      initialProps: { ...defaultArgs, device: deviceMock },
    });

    rerender({ ...defaultArgs, device: bluetoothDeviceMock, error: new UserRefusedOnDevice() });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.exchange,
      }),
      true,
    );
  });
});
