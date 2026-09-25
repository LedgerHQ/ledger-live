import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
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
  getErrorSubError,
  getInvalidOperationFailure,
  setDeviceFlowFailure,
  takeDeviceFlowFailure,
  type DeviceFlowDevice,
} from "./deviceFlowFailure";

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

describe("getErrorSubError", () => {
  it("should return the DMK tag when the error has one", () => {
    expect(getErrorSubError(dmkError)).toBe("DeviceDisconnectedWhileSendingError");
  });

  it("should return the error name when the error has no DMK tag", () => {
    expect(getErrorSubError(new TypeError("boom"))).toBe("TypeError");
  });

  it.each([undefined, null, "boom", 42, {}])(
    "should return Unknown when the error is %p",
    error => {
      expect(getErrorSubError(error)).toBe("Unknown");
    },
  );
});

describe("getConnectDeviceSubError", () => {
  it("should convert a specific error type to PascalCase", () => {
    expect(getConnectDeviceSubError({ type: "ble-pairing-peer-removed-pairing" })).toBe(
      "BlePairingPeerRemovedPairing",
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
  it("should report a discovery error without retry as terminal", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-unsupported", transportId: "RN_BLE" },
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.DiscoveryError,
      isTerminal: true,
      subError: "BluetoothUnsupported",
      transport: "ble",
    });
  });

  it("should report a discovery error with retry as not terminal", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-disabled-promptable" },
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toMatchObject({
      failureType: DeviceFlowFailureType.DiscoveryError,
      isTerminal: false,
      subError: "BluetoothDisabledPromptable",
    });
  });

  it("should report an unknown connection error as terminal with the device", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: BaseConnectionErrorTypes.Unknown, error: dmkError },
      device: knownDevice,
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.ConnectionError,
      isTerminal: true,
      subError: "DeviceDisconnectedWhileSendingError",
      modelId: DeviceModelId.europa,
      transport: "ble",
    });
  });

  it("should report a specific connection error as not terminal", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: "ble-pairing-refused" },
      device: knownDevice,
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toMatchObject({
      isTerminal: false,
      subError: "BlePairingRefused",
    });
  });

  it("should report the connect device unknown error state as terminal", () => {
    const state: SharedConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.UnknownError,
      error: new SyntaxError("boom"),
    };

    expect(getConnectDeviceFailure(state, getTransport)).toEqual({
      failureType: DeviceFlowFailureType.ConnectDeviceUnknownError,
      isTerminal: true,
      subError: "SyntaxError",
    });
  });

  it.each<SharedConnectDeviceUIState>([
    { type: ConnectDeviceUIStateTypes.Loading },
    { type: ConnectDeviceUIStateTypes.NoKnownDevice },
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
  ])("should report the retryable state %p as not terminal", (state, failureType) => {
    expect(getEnsureAppReadyFailure(state, device)).toEqual({
      failureType,
      isTerminal: false,
      subError: undefined,
      ...device,
    });
  });

  it.each<[EnsureAppReadyState, string]>([
    [{ type: BlockingStateType.DeviceNotOnboarded }, DeviceFlowFailureType.DeviceNotOnboarded],
    [{ type: BlockingStateType.InvalidProvider }, DeviceFlowFailureType.InvalidProvider],
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
  ])("should report the blocking state %p as terminal", (state, failureType) => {
    expect(getEnsureAppReadyFailure(state, device)).toMatchObject({
      failureType,
      isTerminal: true,
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
      isTerminal: true,
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
  it("should report a disconnection as terminal with the device", () => {
    expect(getDeviceDisconnectedFailure(device)).toEqual({
      failureType: DeviceFlowFailureType.DeviceDisconnected,
      isTerminal: true,
      ...device,
    });
  });

  it("should report an invalid operation as terminal with its sub error", () => {
    expect(getInvalidOperationFailure(new Error("boom"))).toEqual({
      failureType: DeviceFlowFailureType.InvalidOperation,
      isTerminal: true,
      subError: "Error",
    });
  });
});

describe("failure store", () => {
  afterEach(() => setDeviceFlowFailure(null));

  it("should return the stored failure once and then null", () => {
    const failure = getDeviceDisconnectedFailure(device);
    setDeviceFlowFailure(failure);

    expect(takeDeviceFlowFailure()).toBe(failure);
    expect(takeDeviceFlowFailure()).toBeNull();
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
  it("should expose the failure without the internal terminal flag", () => {
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
});
