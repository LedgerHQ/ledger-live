import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";

/**
 * Builds a Ledger Sync SDK whose device calls go through the DIE session of one job run.
 *
 * The app injects it in the intent input, so this package never imports the SDK setup from
 * `libs/`. The job calls it once per run and reuses the SDK for a retry after a refusal.
 */
export type CreateSessionSdk = (connection: DeviceConnectionResult) => TrustchainSDK;
