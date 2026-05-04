export type ConnectAppDeviceInitializationInput = {
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
};
