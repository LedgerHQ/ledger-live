import getTrustchainApi from "@ledgerhq/ledger-key-ring-protocol/api";
import type { KeyRingServiceStatus } from "../../types";
import { KeyRingServiceStatusSchema } from "../../schema";

/**
 * The health of the v1 key ring backend at `apiBaseUrl`, in every environment: the mock SDK has no
 * status of its own. Rejects with the transport error as is, or on an unexpected shape.
 */
export async function fetchV1ServiceStatus(apiBaseUrl: string): Promise<KeyRingServiceStatus> {
  return KeyRingServiceStatusSchema.parse(await getTrustchainApi(apiBaseUrl).fetchStatus());
}
