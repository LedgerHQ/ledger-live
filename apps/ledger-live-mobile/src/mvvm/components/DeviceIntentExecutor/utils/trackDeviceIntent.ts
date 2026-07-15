import type { ConnectedDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { dmkToLedgerDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  BaseDiscoveryErrorTypes,
  ConnectionErrorTypes,
  DiscoveryErrorTypes,
} from "@ledgerhq/live-dmk-mobile";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
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
 * strings so the property is not fragmented across languages.
 */
export const CONNECT_DEVICE_BUTTON = {
  ConnectDevice: "Connect Device",
  BuyDevice: "Buy Device",
  Retry: "Retry",
  ContinueWithUsb: "Continue with USB",
  OpenSettings: "Open Settings",
  AllowBluetooth: "Allow Bluetooth",
  TurnOnBluetooth: "Turn On Bluetooth",
  AllowLocation: "Allow Location",
  TurnOnLocation: "Turn On Location",
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
  LearnMore: "Learn More",
  DiscoverUpgradeProgram: "Discover Upgrade Program",
  ManageApps: "Manage Apps",
} as const;

export const DEVICE_ACTION_BUTTON = {
  Retry: CONNECT_APP_BUTTON.Retry,
  Close: CONNECT_APP_BUTTON.Close,
} as const;

let isInTerminalConnectDeviceError = false;

export type TrackingTransport = "ble" | "usb";
type ConnectDeviceErrorType = ConnectionErrorTypes | DiscoveryErrorTypes | "unknown";

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
  [BaseDiscoveryErrorTypes.Unknown]: "Unknown",
  [ConnectionErrorTypes.BlePairingRefused]: "BlePairingRefused",
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]: "BlePairingPeerRemovedPairing",
};

const DEVICEFLOW_FAILED_CLOSE_PAGES = new Set<string>([
  PAGE_CONNECT_APP.DeviceNotOnboarded,
  PAGE_CONNECT_APP.UnsupportedFirmware,
  PAGE_CONNECT_APP.UnsupportedApplication,
  PAGE_CONNECT_APP.UnsupportedFeature,
  PAGE_CONNECT_APP.DeviceDeprecatedBlocking,
  PAGE_CONNECT_APP.WrongDeviceForAccount,
  PAGE_CONNECT_APP.OutOfStorage,
  PAGE_CONNECT_APP.Error,
  PAGE_DEVICE_ACTION.Disconnected,
  PAGE_DEVICE_ACTION.UnknownIntentError,
  PAGE_DEVICE_ACTION.InvalidState,
]);

export const getDeviceUxV2BaseProperties = (sourceFlow: SourceFlow) => ({
  sourceFlow,
  deviceUxV2: true,
});

export const setIsInTerminalConnectDeviceError = (value: boolean): void => {
  isInTerminalConnectDeviceError = value;
};

export const getTrackingTransport = (
  transportId: TransportIdentifier | undefined,
): TrackingTransport | undefined => {
  if (!transportId) return undefined;
  return transportId === rnHidTransportIdentifier ? "usb" : "ble";
};

export const getConnectedDeviceTrackingProperties = (
  device: ConnectedDevice,
): { modelId: DeviceModelId; transport: TrackingTransport } => ({
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

export const trackDeviceflowFailed = (params: { sourceFlow: SourceFlow }): void => {
  track("deviceflow_failed", getDeviceUxV2BaseProperties(params.sourceFlow));
};

export const trackDeviceflowCanceled = (params: { sourceFlow: SourceFlow }): void => {
  const currentPage = currentRouteNameRef.current;
  const isTerminalConnectDeviceErrorPage =
    currentPage === PAGE_CONNECT_DEVICE.DiscoveryError ||
    currentPage === PAGE_CONNECT_DEVICE.ConnectionError;

  if (
    (isTerminalConnectDeviceErrorPage && isInTerminalConnectDeviceError) ||
    (currentPage && DEVICEFLOW_FAILED_CLOSE_PAGES.has(currentPage))
  ) {
    trackDeviceflowFailed(params);
    return;
  }

  trackDeviceflowAborted(params);
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

export const trackDeviceActionButtonClicked = (params: {
  sourceFlow: SourceFlow;
  button: string;
  modelId?: DeviceModelId;
  transport?: TrackingTransport;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    button: params.button,
    ...(params.modelId ? { modelId: params.modelId } : {}),
    ...(params.transport ? { transport: params.transport } : {}),
  });
};

export const trackDrawerCloseButtonClicked = (params: { sourceFlow: SourceFlow }): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow),
    button: DEVICE_ACTION_BUTTON.Close,
  });
};
