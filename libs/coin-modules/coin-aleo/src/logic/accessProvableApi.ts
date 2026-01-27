import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ProvableApi } from "../types";
import { apiClient } from "../network/api";
import { generateUniqueUsername } from "./utils";

/**
 * Manages access to the Provable API by handling authentication and account registration.
 *
 * This function ensures valid API credentials are available and up-to-date. It handles:
 * - Initial account registration if API key or consumer ID are missing
 * - JWT token refresh when expired or about to expire (within 5 minutes)
 * - Account registration for scanning records if UUID is not set
 * - Retrieval of current scanner status
 *
 * @param currency - The cryptocurrency being accessed
 * @param viewKey - The view key for the account
 * @param address - The account address
 * @param provableApi - Existing Provable API credentials and state, or null for initial setup
 *
 * @returns A Promise resolving to updated ProvableApi credentials, or null if access needs to be reset
 *
 * @throws {Error} Re-throws any errors except unauthorized errors during JWT retrieval
 *
 * @remarks
 * Edge cases that trigger Provable API access reset (returns null):
 * - Unauthorized error during JWT retrieval, typically indicating:
 *   - Revoked API key
 *   - Invalid consumer credentials
 *   - Account access has been terminated
 *
 * When null is returned, the caller should clear stored Provable API credentials
 * and allow the user to re-initialize access from scratch.
 */

const JWT_EXPIRY_BUFFER_SECONDS = 5 * 60; // 5 minutes safe buffer

export async function accessProvableApi(
  currency: CryptoCurrency,
  viewKey: string,
  address: string,
  provableApi: ProvableApi | null,
): Promise<ProvableApi | null> {
  let apiKey = provableApi?.apiKey;
  let consumerId = provableApi?.consumerId;
  let jwt = provableApi?.jwt;
  let uuid = provableApi?.uuid;
  let synced: boolean | undefined = provableApi?.scannerStatus?.synced ?? false;
  let percentage: number | undefined = provableApi?.scannerStatus?.percentage ?? 0;

  if (!apiKey || !consumerId) {
    const username = generateUniqueUsername(address);

    const { key, consumer } = await apiClient.registerNewAccount(currency, username);

    apiKey = key;
    consumerId = consumer.id;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (!jwt || currentTimestamp >= jwt.exp - JWT_EXPIRY_BUFFER_SECONDS) {
    try {
      jwt = await apiClient.getAccountJWT(currency, apiKey, consumerId);
    } catch (error) {
      // If unauthorized, likely due to revoked API key - return null to reset Provable API access
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return null;
      }
      throw error;
    }
  }

  if (!uuid) {
    const { uuid: accountUuid } = await apiClient.registerForScanningAccountRecords(
      currency,
      jwt.token,
      viewKey,
    );
    uuid = accountUuid;
  }

  const status = await apiClient.getRecordScannerStatus(currency, jwt.token, uuid);
  if (status) {
    synced = status.synced;
    percentage = status.percentage;
  }

  return {
    apiKey,
    consumerId,
    jwt,
    uuid,
    scannerStatus: { synced, percentage },
  };
}
