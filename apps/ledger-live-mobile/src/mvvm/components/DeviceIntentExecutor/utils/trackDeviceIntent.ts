import type { ConnectedDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { dmkToLedgerDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { ConnectionErrorTypes, DiscoveryErrorTypes } from "@ledgerhq/live-dmk-mobile";
import { track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import type { SourceFlow } from "./SourceFlowContext";

export const PAGE_CONNECT_DEVICE = {
  NoKnownDevice: "Connect Device - No Known Device",
  Discovering: "Connect Device - Discovering",
  WaitingForSelectedDevice: "Connect Device - Waiting For Device",
  Connecting: "Connect Device - Connecting",
  DiscoveryError: "Connect Device - Discovery Error",
  ConnectionError: "Connect Device - Connection Error",
} as const;

/**
 * Canonical, locale-independent `button` values for Connect Device `button_clicked`
 * events. The displayed CTA label stays localized; analytics receives these stable
 * strings so the property is not fragmented across languages. The error screen is
 * already disambiguated by the `subError` property, so primary retry/allow CTAs
 * collapse to a single `Retry` value.
 */
export const CONNECT_DEVICE_BUTTON = {
  ConnectLedgerDevice: "Connect Ledger Device",
  NoLedgerDevice: "I Don't Have A Ledger Device",
  Retry: "Retry",
  ContinueWithUsb: "Continue with USB",
  GetHelp: "Get Help",
} as const;

export const PAGE_CONNECT_APP = {
  Loading: "Connect App - Loading",
  InstallingApp: "Connect App - Installing App",
  UnlockDevice: "Connect App - Unlock Device",
  AllowSecureConnection: "Connect App - Allow Secure Connection",
  ConfirmOpenApp: "Connect App - Confirm Open App",
  DeviceDeprecatedWarning: "Connect App - Device Deprecated Warning",
  OutdatedAppWarning: "Connect App - Outdated App Warning",
  DeviceLocked: "Connect App - Device Locked",
  UserRefused: "Connect App - User Refused",
  DeviceBusy: "Connect App - Device Busy",
  DeviceNotOnboarded: "Connect App - Device Not Onboarded",
  UnsupportedFirmware: "Connect App - Unsupported Firmware",
  UnsupportedApplication: "Connect App - Unsupported Application",
  UnsupportedFeature: "Connect App - Unsupported Feature",
  DeviceDeprecatedBlocking: "Connect App - Device Deprecated Blocking",
  WrongDeviceForAccount: "Connect App - Wrong Device For Account",
  OutOfStorage: "Connect App - Out Of Storage",
  Error: "Connect App - Error",
} as const;

export const PAGE_DEVICE_ACTION = {
  Disconnected: "Device Action - Disconnected",
  UnknownIntentError: "Device Action - Unknown Intent Error",
  InvalidState: "Device Action - Invalid State",
} as const;

/**
 * Canonical, locale-independent `button` values for Connect App `button_clicked`
 * events. The displayed CTA label stays localized; analytics receives these stable
 * strings so the property is not fragmented across languages.
 */
export const CONNECT_APP_BUTTON = {
  Continue: "Continue",
  Cancel: "Cancel",
  Retry: "Retry",
  Close: "Close",
  SetUpDevice: "Set Up Device",
  UpdateFirmware: "Update Firmware",
  ContactLedgerSupport: "Contact Ledger Support",
  ManageApps: "Manage Apps",
} as const;

export type TrackingTransport = "ble" | "usb";
type ConnectDeviceErrorType = ConnectionErrorTypes | DiscoveryErrorTypes;

const TRACKING_SUB_ERRORS: Record<ConnectDeviceErrorType, string> = {
  [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]: "BluetoothPermissionDeniedPromptable",
  [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]:
    "BluetoothPermissionDeniedManualSettings",
  [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]:
    "BluetoothPermissionUnauthorizedManualSettings",
  [DiscoveryErrorTypes.BluetoothDisabledPromptable]: "BluetoothDisabledPromptable",
  [DiscoveryErrorTypes.BluetoothDisabledManualAction]: "BluetoothDisabledManualAction",
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]: "BluetoothStateUnknownCheckOnly",
  [DiscoveryErrorTypes.BluetoothUnsupported]: "BluetoothUnsupported",
  [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]: "LocationPermissionDeniedPromptable",
  [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]:
    "LocationPermissionDeniedManualSettings",
  [DiscoveryErrorTypes.LocationDisabledPromptable]: "LocationDisabledPromptable",
  [DiscoveryErrorTypes.LocationDisabledManualAction]: "LocationDisabledManualAction",
  [DiscoveryErrorTypes.LocationServicePermissionMissing]: "LocationServicePermissionMissing",
  [DiscoveryErrorTypes.Unknown]: "Unknown",
  [ConnectionErrorTypes.BlePairingRefused]: "BlePairingRefused",
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]: "BlePairingPeerRemovedPairing",
};

export const getDeviceUxV2BaseProperties = (sourceFlow: SourceFlow) => ({
  sourceFlow,
  source: previousRouteNameRef.current,
  deviceUxV2: true,
});

export const getTrackingTransport = (
  transportId: TransportIdentifier | undefined,
): TrackingTransport | undefined => {
  if (!transportId) return undefined;
  return transportId === rnHidTransportIdentifier ? "usb" : "ble";
};

export const getConnectedDeviceTrackingProperties = (device: ConnectedDevice) => ({
  modelId: dmkToLedgerDeviceIdMap[device.modelId],
  transport: device.type === "USB" ? "usb" : "ble",
});

export const getTrackingSubError = (errorType: ConnectDeviceErrorType): string =>
  TRACKING_SUB_ERRORS[errorType];

export const trackDeviceflowStarted = (params: { sourceFlow: SourceFlow }): void => {
  track("deviceflow_started", getDeviceUxV2BaseProperties(params.sourceFlow));
};

export const trackDevicePrompted = (params: { sourceFlow: SourceFlow }): void => {
  track("device_prompted", getDeviceUxV2BaseProperties(params.sourceFlow));
};

export const trackDeviceConnecting = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: "ble" | "usb";
}): void => {
  track("device_connecting", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.modelId,
    transport: params.transport,
    matchedDevice: params.modelId,
  });
};

export const trackDeviceConnected = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: "ble" | "usb";
}): void => {
  track("device_connected", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.modelId,
    transport: params.transport,
    matchedDevice: params.modelId,
  });
};

export const trackAppReady = (params: { sourceFlow: SourceFlow; modelId: DeviceModelId }): void => {
  track("app_ready", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.modelId,
  });
};

export const trackDeviceflowCompleted = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: "ble" | "usb";
}): void => {
  track("deviceflow_completed", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.modelId,
    transport: params.transport,
  });
};

export const trackDeviceflowAborted = (params: { sourceFlow: SourceFlow }): void => {
  track("deviceflow_aborted", getDeviceUxV2BaseProperties(params.sourceFlow));
};

export const trackDeviceSelected = (params: {
  sourceFlow: SourceFlow;
  device: KnownDevice;
}): void => {
  track("device_selected", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.device.deviceModelId,
    transport: params.device.transport === rnHidTransportIdentifier ? "usb" : "ble",
  });
};

export const trackConnectDeviceButtonClicked = (params: {
  sourceFlow: SourceFlow;
  button: string;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    button: params.button,
  });
};

export const trackConnectAppButtonClicked = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  button: string;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    modelId: params.modelId,
    button: params.button,
  });
};
