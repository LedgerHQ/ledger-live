import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  type TransportFactory,
  type LoggerSubscriberService,
  type DmkConfig,
} from "@ledgerhq/device-management-kit";

let instance: DeviceManagementKit | null = null;

export type DmkInitParams = {
  transports: TransportFactory[];
  loggers?: LoggerSubscriberService[];
  config?: Partial<DmkConfig>;
};

/**
 * Initialize the shared DMK singleton. Must be called exactly once per app lifecycle,
 * before any call to `getDeviceManagementKit()`.
 */
export function initDmk({ transports, loggers = [], config }: DmkInitParams): DeviceManagementKit {
  if (instance) {
    throw new Error("DeviceManagementKit already initialized. Call initDmk only once.");
  }

  let builder = new DeviceManagementKitBuilder();
  for (const t of transports) {
    builder = builder.addTransport(t);
  }
  for (const l of loggers) {
    builder = builder.addLogger(l);
  }
  if (config) {
    builder = builder.addConfig(config);
  }

  instance = builder.build();
  return instance;
}

export function getDeviceManagementKit(): DeviceManagementKit {
  if (!instance) {
    throw new Error("DeviceManagementKit not initialized. Call initDmk first.");
  }
  return instance;
}

/** Reset the singleton. Intended for tests only. */
export function resetDmk(): void {
  instance = null;
}
