import { renderHook } from "@testing-library/react-native";
import { useTrackReceiveFlow, UseTrackReceiveFlow } from "./useTrackReceiveFlow";
import { track } from "../segment";
import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

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
});
