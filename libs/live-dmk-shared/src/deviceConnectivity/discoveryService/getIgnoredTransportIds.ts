import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { DeviceDiscoveryService } from "../types";

/** The transports that the last `start()` of the service ignored, plus `transportIdToIgnore`. */
export const getIgnoredTransportIds = (
  {
    transportIds,
    scanningTransportIds,
  }: Pick<DeviceDiscoveryService, "transportIds" | "scanningTransportIds">,
  transportIdToIgnore?: TransportIdentifier,
): Array<TransportIdentifier> => {
  const scanning = new Set(scanningTransportIds);
  const ignoredTransportIds = transportIds.filter(transportId => !scanning.has(transportId));
  if (!transportIdToIgnore || ignoredTransportIds.includes(transportIdToIgnore)) {
    return ignoredTransportIds;
  }
  return [...ignoredTransportIds, transportIdToIgnore];
};
