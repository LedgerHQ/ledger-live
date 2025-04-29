import { renderHook } from "tests/testSetup";
import {
  useTrackGenericDAppTransactionSend,
  UseTrackGenericDAppTransactionSend,
} from "./useTrackGenericDAppTransactionSend";
import { track } from "../segment";
import {
  UserRefusedAllowManager,
  UserRefusedOnDevice,
  CantOpenDevice,
  LockedDeviceError,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackGenericDAppTransactionSend", () => {
  const deviceMock = {
    modelId: "stax",
    wired: true,
  };

  const defaultArgs: UseTrackGenericDAppTransactionSend = {
    location: HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend,
    device: deviceMock,
    allowManagerRequested: undefined,
    error: null,
    requestOpenApp: null,
    openedAppName: null,
    isTrackingEnabled: true,
    isLocked: false,
    inWrongDeviceForAccount: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Secure Channel approved' when allowManagerRequested changes from true to false and no error", () => {
    const { rerender } = renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, allowManagerRequested: true },
      },
    );

    rerender({ ...defaultArgs, allowManagerRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it("should track 'Secure Channel refused' when error is UserRefusedAllowManager", () => {
    const error = new UserRefusedAllowManager();

    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, error, allowManagerRequested: false },
      },
    );

    expect(track).toHaveBeenCalledWith(
      "Secure Channel refused",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it("should track 'User opened app' when openedAppName matches a previously requested app", () => {
    const requestApp = "SomeApp";

    const { rerender } = renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: requestApp },
      },
    );

    rerender({ ...defaultArgs, requestOpenApp: requestApp, openedAppName: requestApp });

    expect(track).toHaveBeenCalledWith(
      "User opened app",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it("should track 'User refused to open app' when a request was made and error is UserRefusedOnDevice", () => {
    const requestApp = "SomeApp";
    const error = new UserRefusedOnDevice();

    const { rerender } = renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: requestApp },
      },
    );

    rerender({ ...defaultArgs, error, allowManagerRequested: true, requestOpenApp: requestApp });

    expect(track).toHaveBeenCalledWith(
      "User refused to open app",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it("should not track any events if location is not 'Generic DApp Transaction'", () => {
    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        // @ts-expect-error location not matching the hook requirement
        initialProps: { ...defaultArgs, location: "NOT Generic DApp Transaction" },
      },
    );

    expect(track).not.toHaveBeenCalled();
  });

  it("should track 'Wrong device association' when inWrongDeviceForAccount is provided", () => {
    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, inWrongDeviceForAccount: { accountName: "Test Account" } },
      },
    );

    expect(track).toHaveBeenCalledWith(
      "Wrong device association",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it('should track "Device locked" if isLocked is true', () => {
    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, isLocked: true },
      },
    );

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it('should track "Device locked" if error is LockedDeviceError', () => {
    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, error: new LockedDeviceError() },
      },
    );

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });

  it('should track "Connection failed" if error is CantOpenDevice', () => {
    renderHook(
      (props: UseTrackGenericDAppTransactionSend) => useTrackGenericDAppTransactionSend(props),
      {
        initialProps: { ...defaultArgs, error: new CantOpenDevice() },
      },
    );

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "stax",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
      }),
      true,
    );
  });
});
