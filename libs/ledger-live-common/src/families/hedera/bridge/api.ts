import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import type { HederaCoinConfig } from "@ledgerhq/coin-hedera/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../../config";

export async function getAddressesForPublicKey(
  currency: CryptoCurrency,
  publicKey: string,
): Promise<string[]> {
  const config = getCurrencyConfiguration<HederaCoinConfig>(currency.id);
  const accounts = await apiClient.getAccountsForPublicKey({
    configOrCurrencyId: config,
    publicKey,
  });

  return accounts.map(a => a.account);
}

// Every Hedera account sits on the seed path (`44/3030`), so its key is `seedIdentifier`.
export function keyControlsAccount(publicKey: string, account: Account): boolean {
  return publicKey === account.seedIdentifier;
}

export default function hederaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    addressLookup: {
      getAddresses: derived => getAddressesForPublicKey(currency, derived.publicKey),
      keyControlsAccount,
    },
  };
}
