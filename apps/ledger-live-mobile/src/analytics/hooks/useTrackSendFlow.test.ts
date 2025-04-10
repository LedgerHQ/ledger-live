import { renderHook } from "@testing-library/react-native";
import { useTrackSendFlow, UseTrackSendFlow } from "./useTrackSendFlow";
import { track } from "../segment";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

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
    const { rerender } = renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
    });

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum" });

    expect(track).not.toHaveBeenCalled();
  });
});
