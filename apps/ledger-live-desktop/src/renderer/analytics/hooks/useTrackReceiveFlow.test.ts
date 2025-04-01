import { renderHook } from "tests/testSetup";
import { useTrackReceiveFlow, UseTrackReceiveFlow } from "./useTrackReceiveFlow";
import { track } from "../segment";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { UserRefusedOnDevice, UserRefusedAddress } from "@ledgerhq/errors";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackReceiveFlow", () => {
  const deviceMock = {
    modelId: "europa",
    wired: false,
  };

  const defaultArgs: UseTrackReceiveFlow = {
    location: HOOKS_TRACKING_LOCATIONS.receiveModal,
    device: deviceMock,
    verifyAddressError: null,
    error: null,
    inWrongDeviceForAccount: null,
    isTrackingEnabled: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Open app denied' when UserRefusedOnDevice error is thrown", () => {
    const error = new UserRefusedOnDevice();

    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'Address confirmation rejected' when verifyAddressError is an instance of UserRefusedAddress", () => {
    const verifyAddressError = new UserRefusedAddress();

    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, verifyAddressError },
    });

    expect(track).toHaveBeenCalledWith(
      "Address confirmation rejected",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'Wrong device association' when inWrongDeviceForAccount is provided", () => {
    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, inWrongDeviceForAccount: { accountName: "Test Account" } },
    });

    expect(track).toHaveBeenCalledWith(
      "Wrong device association",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should not track events if location is not 'Receive Modal'", () => {
    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      //@ts-expect-error location should be HOOKS_TRACKING_LOCATIONS enum
      initialProps: { ...defaultArgs, location: "Other Modal" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };
    const verifyAddressError = new UserRefusedAddress();

    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: {
        ...defaultArgs,
        device: wiredDeviceMock,
        verifyAddressError,
      },
    });

    expect(track).toHaveBeenCalledWith(
      "Address confirmation rejected",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });
});
