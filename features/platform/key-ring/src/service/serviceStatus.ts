import getTrustchainApi from "@ledgerhq/ledger-key-ring-protocol/api";
import type { KeyRingServiceStatus } from "../types";
import { KeyRingServiceStatusSchema } from "../schema";

/**
 * The health of the key ring backend at `apiBaseUrl`, for the Ledger Sync status screen. Rejects
 * when the backend cannot be reached or answers an unexpected shape.
 */
export async function fetchKeyRingServiceStatus(apiBaseUrl: string): Promise<KeyRingServiceStatus> {
  return KeyRingServiceStatusSchema.parse(await getTrustchainApi(apiBaseUrl).fetchStatus());
}
