import type { DeviceDisconnectedComponent } from "@features/platform-device-intent";
import {
  dmkToLedgerDeviceIdMap,
  type DeviceIntentTrackingProperties,
  type KnownDevice,
  type SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  webHidTransportIdentifier,
} from "@ledgerhq/live-dmk-desktop";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { ComponentProps } from "react";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

type ConnectedDevice = ComponentProps<DeviceDisconnectedComponent>["device"];

export const PAGE_CONNECT_DEVICE = {
  NoKnownDevice: "Connect Device - No Known Device",
  Discovering: "Connect Device - Discovering",
  WaitingForSelectedDevice: "Connect Device - Waiting For Device",
  Connecting: "Connect Device - Connecting",
  DiscoveryError: "Connect Device - Discovery Error",
  ConnectionError: "Connect Device - Connection Error",
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
  InvalidProvider: "Connect App - Invalid Provider",
  Error: "Connect App - Error",
} as const;

export const PAGE_DEVICE_ACTION = {
  Disconnected: "Device Action - Disconnected",
  UnknownIntentError: "Device Action - Unknown Intent Error",
  InvalidState: "Device Action - Invalid State",
} as const;

/**
 * Canonical, locale-independent `button` values for Device Action `button_clicked`
 * events. The displayed CTA label stays localized; analytics receives these stable
 * strings so the property is not fragmented across languages.
 */
export const DEVICE_ACTION_BUTTON = {
  Retry: "Retry",
  Close: "Close",
} as const;

export const CONNECT_DEVICE_BUTTON = {
  ConnectDevice: "Connect Device",
  BuyDevice: "Buy Device",
  Retry: "Retry",
} as const;

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
  GoToSettings: "Go To Settings",
} as const;

let isInTerminalConnectDeviceError = false;

const DEVICEFLOW_FAILED_CLOSE_PAGES = new Set<string>([
  PAGE_CONNECT_APP.DeviceNotOnboarded,
  PAGE_CONNECT_APP.UnsupportedFirmware,
  PAGE_CONNECT_APP.UnsupportedApplication,
  PAGE_CONNECT_APP.UnsupportedFeature,
  PAGE_CONNECT_APP.DeviceDeprecatedBlocking,
  PAGE_CONNECT_APP.WrongDeviceForAccount,
  PAGE_CONNECT_APP.OutOfStorage,
  PAGE_CONNECT_APP.InvalidProvider,
  PAGE_CONNECT_APP.Error,
  PAGE_DEVICE_ACTION.Disconnected,
  PAGE_DEVICE_ACTION.UnknownIntentError,
  PAGE_DEVICE_ACTION.InvalidState,
]);

export type TrackingTransport = "ble" | "usb";

export const getTrackingTransport = (
  transportId: KnownDevice["transport"] | undefined,
): TrackingTransport | undefined => {
  if (!transportId) return undefined;

  return transportId === webHidTransportIdentifier ? "usb" : "ble";
};

export const getTrackingSubError = (
  _errorType: BaseDiscoveryErrorTypes | BaseConnectionErrorTypes,
): string => "Unknown";

export const getDeviceUxV2BaseProperties = (
  sourceFlow: SourceFlow,
  extraProperties?: DeviceIntentTrackingProperties,
) => ({
  ...extraProperties,
  sourceFlow,
  deviceUxV2: true,
});

export const getConnectedDeviceTrackingProperties = (
  device: ConnectedDevice,
): { modelId: DeviceModelId; transport: TrackingTransport } => ({
  modelId: dmkToLedgerDeviceIdMap[device.modelId],
  transport: device.type === "USB" ? "usb" : "ble",
});

export const setIsInTerminalConnectDeviceError = (value: boolean): void => {
  isInTerminalConnectDeviceError = value;
};

export const trackDeviceflowStarted = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track(
    "deviceflow_started",
    getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
  );
};

export const trackDevicePrompted = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("device_prompted", getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties));
};

export const trackDeviceConnecting = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: TrackingTransport;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("device_connecting", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.modelId,
    transport: params.transport,
    matchedDevice: params.modelId,
  });
};

export const trackDeviceConnected = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: TrackingTransport;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("device_connected", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.modelId,
    transport: params.transport,
    matchedDevice: params.modelId,
  });
};

export const trackAppReady = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("app_ready", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.modelId,
  });
};

export const trackDeviceflowCompleted = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  transport: TrackingTransport;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("deviceflow_completed", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.modelId,
    transport: params.transport,
  });
};

export const trackDeviceflowAborted = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track(
    "deviceflow_aborted",
    getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
  );
};

export const trackDeviceflowFailed = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track(
    "deviceflow_failed",
    getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
  );
};

export const trackDeviceflowCanceled = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
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

export const trackDeviceActionButtonClicked = (params: {
  sourceFlow: SourceFlow;
  button: string;
  modelId?: DeviceModelId;
  transport?: TrackingTransport;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    button: params.button,
    ...(params.modelId ? { modelId: params.modelId } : {}),
    ...(params.transport ? { transport: params.transport } : {}),
  });
};

export const trackDeviceSelected = (params: {
  sourceFlow: SourceFlow;
  device: KnownDevice;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("device_selected", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.device.deviceModelId,
    transport: params.device.transport === webHidTransportIdentifier ? "usb" : "ble",
  });
};

export const trackConnectDeviceButtonClicked = (params: {
  sourceFlow: SourceFlow;
  button: string;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    button: params.button,
  });
};

export const trackConnectAppButtonClicked = (params: {
  sourceFlow: SourceFlow;
  modelId: DeviceModelId;
  button: string;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    modelId: params.modelId,
    button: params.button,
  });
};

export const trackDrawerCloseButtonClicked = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    button: DEVICE_ACTION_BUTTON.Close,
  });
};
