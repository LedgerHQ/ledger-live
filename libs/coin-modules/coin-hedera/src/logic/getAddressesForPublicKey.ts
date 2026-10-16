import { apiClient } from "../network/api";
import type { HederaCoinConfig } from "../types";

/**
 * The Hedera accounts a public key controls, as the mirror node lists them: a Hedera address is an
 * account id the network assigns, so a scan cannot derive it from the key.
 */
export async function getAddressesForPublicKey(
  config: HederaCoinConfig,
  publicKey: string,
): Promise<string[]> {
  const accounts = await apiClient.getAccountsForPublicKey({
    configOrCurrencyId: config,
    publicKey,
  });
  return accounts.map(account => account.account);
}
