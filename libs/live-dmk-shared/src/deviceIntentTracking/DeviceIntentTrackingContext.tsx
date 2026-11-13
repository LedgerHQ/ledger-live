import React from "react";
import type { DeviceIntentTrackingContextValue, DeviceIntentTrackingProperties } from "./types";

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
