import { renderHook } from "tests/testUtils";
import { useTrackReceiveFlow, UseTrackReceiveFlow } from "./useTrackReceiveFlow";
import { track } from "../segment";
import { UserRefusedOnDevice } from "@ledgerhq/errors";

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
    location: "Receive Modal",
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
        connectionType: "BLE",
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'Address confirmation rejected' when verifyAddressError has name 'UserRefusedAddress'", () => {
    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, verifyAddressError: { name: "UserRefusedAddress" } },
    });

    expect(track).toHaveBeenCalledWith(
      "Address confirmation rejected",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: "BLE",
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
        connectionType: "BLE",
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should not track events if location is not 'Receive Modal'", () => {
    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: { ...defaultArgs, location: "Other Modal" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    renderHook((props: UseTrackReceiveFlow) => useTrackReceiveFlow(props), {
      initialProps: {
        ...defaultArgs,
        device: wiredDeviceMock,
        verifyAddressError: { name: "UserRefusedAddress" },
      },
    });

    expect(track).toHaveBeenCalledWith(
      "Address confirmation rejected",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: "USB",
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });
});
