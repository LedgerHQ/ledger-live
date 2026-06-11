import React from "react";

type CleanupDeviceIntentExecutorHeaderOverride = () => void;

export type DeviceIntentExecutorHeaderContextValue = Readonly<{
  requestHeaderOverride: () => CleanupDeviceIntentExecutorHeaderOverride;
}>;

export const DeviceIntentExecutorHeaderContext = React.createContext<
  DeviceIntentExecutorHeaderContextValue | undefined
>(undefined);
