import { renderHook } from "tests/testSetup";
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
    modelId: "europa",
    wired: false,
  };

  const defaultArgs: UseTrackSendFlow = {
    location: HOOKS_TRACKING_LOCATIONS.sendModal,
    device: deviceMock,
    error: null,
    inWrongDeviceForAccount: null,
    isTrackingEnabled: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Open app denied' when UserRefusedOnDevice error is thrown", () => {
    const error = new UserRefusedOnDevice();

    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Send",
      }),
      true,
    );
  });

  it("should track 'Wrong device association' when inWrongDeviceForAccount is provided", () => {
    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, inWrongDeviceForAccount: { accountName: "Test Account" } },
    });

    expect(track).toHaveBeenCalledWith(
      "Wrong device association",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Send",
      }),
      true,
    );
  });

  it("should not track events if location is not 'Send Modal'", () => {
    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      //@ts-expect-error location is not of type HOOKS_TRACKING_LOCATIONS
      initialProps: { ...defaultArgs, location: "Other Modal" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, device: wiredDeviceMock, error: new UserRefusedOnDevice() },
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Send",
      }),
      true,
    );
  });

  it("should handle no tracking when isTrackingEnabled is false", () => {
    renderHook((props: UseTrackSendFlow) => useTrackSendFlow(props), {
      initialProps: { ...defaultArgs, isTrackingEnabled: false, error: new UserRefusedOnDevice() },
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Send",
      }),
      false,
    );
  });
});
