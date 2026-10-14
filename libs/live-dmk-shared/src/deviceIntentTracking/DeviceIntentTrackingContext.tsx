import React from "react";
import type { DeviceFlowFailure } from "./deviceFlowFailure";

/**
 * Originating user intent that initiated the device flow.
 */
export type SourceFlow =
  | "send"
  | "receive"
  | "swap"
  | "buy/sell"
  | "earn"
  | "add_account"
  | "my_ledger"
  | "wallet_connect"
  | "wallet_api"
  | "onboarding"
  | "contacts"
  | "debug";

type ReservedDeviceIntentTrackingProperties = {
  sourceFlow?: never;
  deviceUxV2?: never;
  category?: never;
  name?: never;
  modelId?: never;
  transport?: never;
  matchedDevice?: never;
  subError?: never;
  failureType?: never;
  button?: never;
  refreshSource?: never;
  avoidDuplicates?: never;
  mandatory?: never;
};

/**
 * Caller-specific properties attached to every tracking event of a DIE flow.
 * DIE-owned properties are reserved so callers cannot overwrite them.
 */
export type DeviceIntentTrackingProperties = Record<string, string | number | boolean | undefined> &
  ReservedDeviceIntentTrackingProperties;

export type DeviceIntentTrackingContextValue = {
  sourceFlow: SourceFlow;
  analyticsProperties: DeviceIntentTrackingProperties;
  /** Reports the error screen currently displayed, or `null` once the flow leaves it. */
  reportFailure: (failure: DeviceFlowFailure | null) => void;
};

const emptyAnalyticsProperties: DeviceIntentTrackingProperties = {};
const ignoreFailure = () => undefined;

const DeviceIntentTrackingContext = React.createContext<DeviceIntentTrackingContextValue | null>(
  null,
);

type DeviceIntentTrackingProviderProps = React.PropsWithChildren<{
  value: Omit<DeviceIntentTrackingContextValue, "analyticsProperties" | "reportFailure"> & {
    analyticsProperties?: DeviceIntentTrackingProperties;
    reportFailure?: DeviceIntentTrackingContextValue["reportFailure"];
  };
}>;

export function DeviceIntentTrackingProvider({
  value,
  children,
}: DeviceIntentTrackingProviderProps): React.ReactNode {
  const { sourceFlow, analyticsProperties, reportFailure } = value;
  const contextValue = React.useMemo(
    () => ({
      sourceFlow,
      analyticsProperties: analyticsProperties ?? emptyAnalyticsProperties,
      reportFailure: reportFailure ?? ignoreFailure,
    }),
    [sourceFlow, analyticsProperties, reportFailure],
  );

  return (
    <DeviceIntentTrackingContext.Provider value={contextValue}>
      {children}
    </DeviceIntentTrackingContext.Provider>
  );
}

export function useDeviceIntentTracking(): DeviceIntentTrackingContextValue {
  const value = React.useContext(DeviceIntentTrackingContext);
  if (!value) {
    throw new Error("useDeviceIntentTracking must be used inside <DeviceIntentTrackingProvider>");
  }
  return value;
}
