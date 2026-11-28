import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import { EMPTY, type Observable } from "rxjs";
import type {
  BaseDiscoveryError,
  DeviceDiscoveryService,
  DeviceDiscoveryStartArgs,
} from "../../types";

type FakeDeviceDiscoveryServiceOptions<TDiscoveryError extends BaseDiscoveryError> = {
  transportIds?: Array<TransportIdentifier>;
  discoveredDevices?: Observable<DiscoveredDevice[]>;
  errors?: Observable<TDiscoveryError>;
  onStop?: () => void;
};

/** Keeps `isRunning` and the ignored transports like `DefaultDeviceDiscoveryService`. */
export const createFakeDeviceDiscoveryService = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>({
  transportIds = [],
  discoveredDevices = EMPTY,
  errors = EMPTY,
  onStop,
}: FakeDeviceDiscoveryServiceOptions<TDiscoveryError> = {}) => {
  let isRunning = false;
  let ignoredTransportIds: Array<TransportIdentifier> = [];

  const service = {
    get isRunning() {
      return isRunning;
    },
    transportIds,
    get ignoredTransportIds() {
      return ignoredTransportIds;
    },
    discoveredDevices,
    errors,
    start: jest.fn(({ ignoreTransportIdentifiers = [] }: DeviceDiscoveryStartArgs = {}) => {
      if (isRunning) {
        return;
      }
      isRunning = true;
      ignoredTransportIds = ignoreTransportIdentifiers;
    }),
    stop: jest.fn(() => {
      isRunning = false;
      onStop?.();
    }),
  } satisfies DeviceDiscoveryService<TDiscoveryError>;

  return service;
};
