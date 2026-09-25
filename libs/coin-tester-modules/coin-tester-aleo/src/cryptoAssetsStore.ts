import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { FrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

/**
 * A fixed-list CAL double. The real store (`setupCalStore` in
 * coin-aleo/__tests__/helpers/cal.ts) reaches global.api.prd.ledger.com,
 * which the scenario's unhandled-request guard rejects — this is the
 * localhost-safe substitute.
 */
export function createCryptoAssetsStore(tokens: TokenCurrency[]): FrameworkCryptoAssetsStore {
  // Computed once so getTokensSyncHash is stable across calls: performPublicSync
  // compares it against the stored syncHash, and an unstable value forces a
  // full re-sync from height 0 on every cycle.
  const syncHash = tokens.map(token => token.id).join(",");

  return {
    findTokenById: async tokenId => tokens.find(token => token.id === tokenId),
    findTokenByAddressInCurrency: async (address, currencyId) =>
      tokens.find(
        token => token.contractAddress === address && token.parentCurrencyId === currencyId,
      ),
    getTokensSyncHash: async () => syncHash,
  };
}
