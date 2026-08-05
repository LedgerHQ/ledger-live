import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

export { filterAccountsExcludingBlacklisted } from "./filterAccountsExcludingBlacklisted";

// TODO: remove this export and prefer import from root file.
export {
  accountWithMandatoryTokens,
  findTokenAccountByCurrency,
  flattenAccounts,
  getMainAccount,
  getAccountCurrency,
  getAccountSpendableBalance,
  getFeesCurrency,
  getFeesUnit,
  getParentAccount,
  isAccount,
  isAccountBalanceUnconfirmed,
  isTokenAccount,
  listSubAccounts,
  shortAddressPreview,
} from "@ledgerhq/ledger-wallet-framework/account/index";

/**
 * Load blacklisted (hidden) assets and organize them into sections by parent currency.
 * Hidden ids can be native coins (grouped under themselves) as well as tokens (grouped
 * under their parent). Token lookups are isolated so one failure keeps the rest of the list.
 */
export async function loadBlacklistedTokenSections(
  assetIds: string[],
): Promise<Array<{ parentCurrency: CryptoCurrency; assets: CryptoOrTokenCurrency[] }>> {
  const resolved = await Promise.all(
    assetIds.map(async (assetId): Promise<CryptoOrTokenCurrency | undefined> => {
      const coin = findCryptoCurrencyById(assetId);
      if (coin) {
        return coin;
      }
      return getCryptoAssetsStore()
        .findTokenById(assetId)
        .catch(() => undefined);
    }),
  );

  const sections: Array<{ parentCurrency: CryptoCurrency; assets: CryptoOrTokenCurrency[] }> = [];

  for (const asset of resolved) {
    if (!asset) continue;

    const parentCurrency =
      asset.type === "TokenCurrency" ? findCryptoCurrencyById(asset.parentCurrencyId) : asset;
    if (!parentCurrency) continue;

    const index = sections.findIndex(s => s.parentCurrency === parentCurrency);
    if (index < 0) {
      sections.push({
        parentCurrency,
        assets: [asset],
      });
    } else {
      sections[index].assets.push(asset);
    }
  }

  return sections;
}
