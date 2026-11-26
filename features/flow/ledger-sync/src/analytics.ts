import { track } from "@shared/analytics";
import type { LedgerSyncFlowProperties, LedgerSyncRejectedOnDeviceProperties } from "./types";

/** The Ledger Sync lifecycle events. Page views and button clicks stay in each app. */
export const LedgerSyncAnalyticsEvent = Object.freeze({
  activated: "ledgersync_activated",
  deactivated: "ledgersync_deactivated",
  rejectedOnDevice: "ledgersync_rejected_on_device",
} as const);

/**
 * Tracks that this instance joined a key tree. The app passes its `flow` property.
 *
 * @example
 * ```ts
 * trackLedgerSyncActivated({ flow: trackingFlow });
 * ```
 */
export function trackLedgerSyncActivated(properties: LedgerSyncFlowProperties): void {
  void track(LedgerSyncAnalyticsEvent.activated, properties);
}

/** Tracks that this instance left Ledger Sync. */
export function trackLedgerSyncDeactivated(): void {
  void track(LedgerSyncAnalyticsEvent.deactivated);
}

/**
 * Tracks that the user refused a Ledger Sync request on the device.
 *
 * @example
 * ```ts
 * trackLedgerSyncRejectedOnDevice({
 *   modelId: device.modelId,
 *   connectionType: device.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
 * });
 * ```
 */
export function trackLedgerSyncRejectedOnDevice({
  modelId,
  connectionType,
}: LedgerSyncRejectedOnDeviceProperties): void {
  void track(LedgerSyncAnalyticsEvent.rejectedOnDevice, {
    page: "Ledger Sync",
    modelId,
    connectionType,
  });
}
