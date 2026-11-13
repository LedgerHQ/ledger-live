type CleanupDeviceIntentExecutorHeaderOverride = () => void;

export type DeviceIntentExecutorHeaderContextValue = Readonly<{
  requestHeaderOverride: () => CleanupDeviceIntentExecutorHeaderOverride;
}>;
