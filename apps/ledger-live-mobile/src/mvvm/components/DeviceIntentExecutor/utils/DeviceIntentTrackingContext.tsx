import React from "react";

/**
 * Originating user intent that initiated the device flow — sticky across mid-flow
 * detours. Every DIE caller MUST pass the value through `DeviceIntentExecutorLWM`.
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
};

const emptyAnalyticsProperties: DeviceIntentTrackingProperties = {};

const DeviceIntentTrackingContext = React.createContext<DeviceIntentTrackingContextValue | null>(
  null,
);

type DeviceIntentTrackingProviderProps = React.PropsWithChildren<{
  value: Omit<DeviceIntentTrackingContextValue, "analyticsProperties"> & {
    analyticsProperties?: DeviceIntentTrackingProperties;
  };
}>;

export function DeviceIntentTrackingProvider({
  value,
  children,
}: DeviceIntentTrackingProviderProps): React.ReactNode {
  const { sourceFlow, analyticsProperties } = value;
  const contextValue = React.useMemo(
    () => ({
      sourceFlow,
      analyticsProperties: analyticsProperties ?? emptyAnalyticsProperties,
    }),
    [sourceFlow, analyticsProperties],
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
