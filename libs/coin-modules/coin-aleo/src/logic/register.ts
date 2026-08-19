import invariant from "invariant";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import type { AleoCoinConfig, AleoRegistration } from "../types";

/**
 * Enrolls a view key into the Provable record scanner and returns its `provableId` handle.
 *
 * Not idempotent: each call enrolls again, so the caller persists the `provableId` and only
 * registers when it is missing.
 */
export async function register(config: AleoCoinConfig, viewKey: string): Promise<AleoRegistration> {
  invariant(viewKey, "aleo/register: a view key is required to register with the Provable scanner");

  const { public_key, key_id } = await apiClient.getScannerPublicKey(config);

  const { encrypted: encryptedData } = await sdkClient.encryptRegistrationPayload({
    config,
    publicKey: public_key,
    viewKey,
    start: 0,
  });

  const { uuid } = await apiClient.registerForScanningAccountRecordsEncrypted({
    config,
    encryptedData,
    keyId: key_id,
  });

  return { type: "aleo", provableId: uuid };
}
