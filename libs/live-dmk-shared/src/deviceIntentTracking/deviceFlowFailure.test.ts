import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type KnownDevice,
} from "../connectDevice/types";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "../device-action/EnsureAppReady/state";
import {
  DeviceFlowFailureType,
  getConnectDeviceFailure,
  getConnectDeviceSubError,
  getDeviceDisconnectedFailure,
  getDeviceFlowFailureProperties,
  getDeviceflowCancelEventName,
  getEnsureAppReadyFailure,
  getErrorName,
  getInvalidOperationFailure,
  type DeviceFlowDevice,
} from "./deviceFlowFailure";
import {
  type BaseConnectionError,
  BaseConnectionErrorTypes,
  type BaseDiscoveryError,
  BaseDiscoveryErrorTypes,
} from "../deviceConnectivity/types";

type SharedConnectDeviceUIState = ConnectDeviceUIState<BaseDiscoveryError, BaseConnectionError>;

const USB_TRANSPORT_ID = "WEB-HID";
const getTransport = (transportId: KnownDevice["transport"] | undefined) => {
  if (!transportId) return undefined;
  return transportId === USB_TRANSPORT_ID ? "usb" : "ble";
};

const knownDevice: KnownDevice = {
  id: "device-id",
  name: "Ledger Flex",
  deviceModelId: DeviceModelId.europa,
  transport: "RN_BLE",
};

const device: DeviceFlowDevice = { modelId: DeviceModelId.stax, transport: "usb" };

const dmkError = { _tag: "DeviceDisconnectedWhileSendingError", message: "user-owned text" };

describe("getErrorName", () => {
  it("should return the DMK tag when the error has one", () => {
    expect(getErrorName(dmkError)).toBe("DeviceDisconnectedWhileSendingError");
  });

  it("should return the error name when the error has no DMK tag", () => {
    expect(getErrorName(new TypeError("boom"))).toBe("TypeError");
  });

  it.each([undefined, null, "boom", 42, {}])(
    "should return Unknown when the error is %p",
    error => {
      expect(getErrorName(error)).toBe("Unknown");
    },
  );
});

describe("getConnectDeviceSubError", () => {
  it("should return a specific error type as is", () => {
    expect(getConnectDeviceSubError({ type: "ble-pairing-peer-removed-pairing" })).toBe(
      "ble-pairing-peer-removed-pairing",
    );
  });

  it("should identify an unknown discovery error with its wrapped error", () => {
    expect(
      getConnectDeviceSubError({ type: BaseDiscoveryErrorTypes.Unknown, error: dmkError }),
    ).toBe("DeviceDisconnectedWhileSendingError");
  });

  it("should identify an unknown connection error with its wrapped error", () => {
    expect(
      getConnectDeviceSubError({
        type: BaseConnectionErrorTypes.Unknown,
        error: new RangeError("boom"),
      }),
    ).toBe("RangeError");
  });

  it("should return Unknown when an unknown error wraps nothing", () => {
    expect(getConnectDeviceSubError({ type: BaseConnectionErrorTypes.Unknown })).toBe("Unknown");
  });
});

describe("getConnectDeviceFailure", () => {
  it("should report a discovery error without retry as a failure", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-unsupported", transportId: "RN_BLE" },
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.DiscoveryError,
      countsAsFailure: true,
      subError: "bluetooth-unsupported",
      transport: "ble",
    });
  });

  it("should report a discovery error with retry as not a failure", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-disabled-promptable" },
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toMatchObject({
      failureType: DeviceFlowFailureType.DiscoveryError,
      countsAsFailure: false,
      subError: "bluetooth-disabled-promptable",
    });
  });

  it("should report an unknown connection error as a failure with the device", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: BaseConnectionErrorTypes.Unknown, error: dmkError },
      device: knownDevice,
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.ConnectionError,
      countsAsFailure: true,
      subError: "DeviceDisconnectedWhileSendingError",
      modelId: DeviceModelId.europa,
      transport: "ble",
    });
  });

  it("should report a specific connection error as not a failure", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: "ble-pairing-refused" },
      device: knownDevice,
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toMatchObject({
      countsAsFailure: false,
      subError: "ble-pairing-refused",
    });
  });

  it("should report the connect device unknown error state as a failure", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.UnknownError,
      error: new SyntaxError("boom"),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.ConnectDeviceUnknownError,
      countsAsFailure: true,
      subError: "SyntaxError",
    });
  });

  it.each<SharedConnectDeviceUIState>([
    { type: ConnectDeviceUIStateTypes.Loading },
    { type: ConnectDeviceUIStateTypes.NoKnownDevice },
    { type: ConnectDeviceUIStateTypes.Discovering, devices: [] },
    { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice, device: knownDevice },
    { type: ConnectDeviceUIStateTypes.Connecting, device: knownDevice },
    { type: ConnectDeviceUIStateTypes.Connected },
  ])("should return null for the non-error state $type", state => {
    expect(getConnectDeviceFailure(state, getTransport)).toBeNull();
  });
});

describe("getEnsureAppReadyFailure", () => {
  it.each<[EnsureAppReadyState, string]>([
    [
      { type: RetryableStateType.DeviceLocked, retry: jest.fn() },
      DeviceFlowFailureType.DeviceLocked,
    ],
    [
      { type: RetryableStateType.UserRefusedOnDevice, retry: jest.fn() },
      DeviceFlowFailureType.UserRefusedOnDevice,
    ],
    [{ type: RetryableStateType.DeviceBusy, retry: jest.fn() }, DeviceFlowFailureType.DeviceBusy],
  ])("should report the retryable state %p as not a failure", (state, failureType) => {
    expect(getEnsureAppReadyFailure(state, device)).toEqual({
      failureType,
      countsAsFailure: false,
      subError: undefined,
      ...device,
    });
  });

  it.each<[EnsureAppReadyState, string]>([
    [{ type: BlockingStateType.DeviceNotOnboarded }, DeviceFlowFailureType.DeviceNotOnboarded],
    [{ type: BlockingStateType.InvalidProvider }, DeviceFlowFailureType.InvalidProvider],
    [
      {
        type: BlockingStateType.DeviceDeprecatedBlocking,
        decision: {
          status: "block",
          currencyName: "Bitcoin",
          deviceModelId: DeviceModelId.nanoS,
          supportEndDate: new Date("2026-01-01"),
        },
      },
      DeviceFlowFailureType.DeviceDeprecatedBlocking,
    ],
    [
      {
        type: BlockingStateType.UnsupportedApplication,
        appName: "Bitcoin",
        deviceModelId: DeviceModelId.nanoS,
      },
      DeviceFlowFailureType.UnsupportedApplication,
    ],
    [
      { type: BlockingStateType.UnsupportedFeature, deviceModelId: DeviceModelId.nanoS },
      DeviceFlowFailureType.UnsupportedFeature,
    ],
    [
      { type: BlockingStateType.UnsupportedFirmwareVersion },
      DeviceFlowFailureType.UnsupportedFirmwareVersion,
    ],
    [
      { type: BlockingStateType.WrongDeviceForAccount, accountName: "My account" },
      DeviceFlowFailureType.WrongDeviceForAccount,
    ],
    [
      { type: BlockingStateType.DeviceOutOfStorageSpace, appNames: ["Bitcoin"] },
      DeviceFlowFailureType.DeviceOutOfStorageSpace,
    ],
  ])("should report the blocking state %p as a failure", (state, failureType) => {
    expect(getEnsureAppReadyFailure(state, device)).toMatchObject({
      failureType,
      countsAsFailure: true,
    });
  });

  it("should not report the account name of a wrong device", () => {
    const failure = getEnsureAppReadyFailure(
      { type: BlockingStateType.WrongDeviceForAccount, accountName: "My account" },
      device,
    );

    expect(JSON.stringify(failure)).not.toContain("My account");
  });

  it("should report the final error as a terminal connect app error with its sub error", () => {
    expect(
      getEnsureAppReadyFailure({ type: FinalStateType.Error, error: dmkError }, device),
    ).toEqual({
      failureType: DeviceFlowFailureType.ConnectAppError,
      countsAsFailure: true,
      subError: "DeviceDisconnectedWhileSendingError",
      ...device,
    });
  });

  it.each<EnsureAppReadyState>([
    { type: LoadingStateType.Loading },
    { type: LoadingStateType.InstallingApp },
    {
      type: AppInteractionRequiredStateType.OutdatedAppWarning,
      appName: "Bitcoin",
      onContinue: jest.fn(),
    },
  ])("should return null for the non-error state $type", state => {
    expect(getEnsureAppReadyFailure(state, device)).toBeNull();
  });
});

describe("executor failures", () => {
  it("should report a disconnection as a failure with the device", () => {
    expect(getDeviceDisconnectedFailure(device)).toEqual({
      failureType: DeviceFlowFailureType.DeviceDisconnected,
      countsAsFailure: true,
      ...device,
    });
  });

  it("should report an invalid operation as a failure with its sub error", () => {
    expect(getInvalidOperationFailure(new Error("boom"))).toEqual({
      failureType: DeviceFlowFailureType.InvalidOperation,
      countsAsFailure: true,
      subError: "Error",
    });
  });
});

describe("getDeviceflowCancelEventName", () => {
  it("should name a terminal failure deviceflow_failed", () => {
    expect(getDeviceflowCancelEventName(getDeviceDisconnectedFailure(device))).toBe(
      "deviceflow_failed",
    );
  });

  it("should name a non-terminal failure deviceflow_aborted", () => {
    const failure = getEnsureAppReadyFailure(
      { type: RetryableStateType.DeviceLocked, retry: jest.fn() },
      device,
    );

    expect(getDeviceflowCancelEventName(failure)).toBe("deviceflow_aborted");
  });

  it("should name a cancel without failure deviceflow_aborted", () => {
    expect(getDeviceflowCancelEventName(null)).toBe("deviceflow_aborted");
  });
});

describe("getDeviceFlowFailureProperties", () => {
  it("should expose the failure without the internal countsAsFailure flag", () => {
    expect(getDeviceFlowFailureProperties(getDeviceDisconnectedFailure(device))).toEqual({
      failureType: DeviceFlowFailureType.DeviceDisconnected,
      modelId: DeviceModelId.stax,
      transport: "usb",
    });
  });

  it("should omit the properties the failure does not know", () => {
    const properties = getDeviceFlowFailureProperties(
      getInvalidOperationFailure(new Error("boom")),
    );

    expect(Object.keys(properties)).toEqual(["failureType", "subError"]);
  });

  it("should return no properties when no failure is displayed", () => {
    expect(getDeviceFlowFailureProperties(null)).toEqual({});
  });
});
