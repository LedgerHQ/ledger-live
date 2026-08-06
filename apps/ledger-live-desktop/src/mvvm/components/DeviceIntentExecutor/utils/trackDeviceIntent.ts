import type { DeviceDisconnectedComponent } from "@ledgerhq/device-intent";
import {
  dmkToLedgerDeviceIdMap,
  type DeviceIntentTrackingProperties,
  type SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { ComponentProps } from "react";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

type ConnectedDevice = ComponentProps<DeviceDisconnectedComponent>["device"];

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

const DEVICEFLOW_FAILED_CLOSE_PAGES = new Set<string>([
  PAGE_DEVICE_ACTION.Disconnected,
  PAGE_DEVICE_ACTION.UnknownIntentError,
  PAGE_DEVICE_ACTION.InvalidState,
]);

export type TrackingTransport = "ble" | "usb";

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

export const trackDeviceflowStarted = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track(
    "deviceflow_started",
    getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
  );
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

  if (currentPage && DEVICEFLOW_FAILED_CLOSE_PAGES.has(currentPage)) {
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

export const trackDrawerCloseButtonClicked = (params: {
  sourceFlow: SourceFlow;
  extraProperties: DeviceIntentTrackingProperties;
}): void => {
  track("button_clicked", {
    ...getDeviceUxV2BaseProperties(params.sourceFlow, params.extraProperties),
    button: DEVICE_ACTION_BUTTON.Close,
  });
};
