import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";

/** Builds an SDK whose device access goes through the DIE session of this job run. */
export type CreateSessionSdk = (connection: DeviceConnectionResult) => TrustchainSDK;
