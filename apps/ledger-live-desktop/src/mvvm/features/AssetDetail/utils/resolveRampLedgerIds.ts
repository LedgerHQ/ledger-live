import type { AccountLike, DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { ledgerIdsFromLedgerCurrency } from "@ledgerhq/asset-detail";

function collectLedgerIdsForRampFromAccounts(accounts: AccountLike[]): string[] {
  const ids = new Set<string>();
  for (const a of accounts) {
    for (const id of ledgerIdsFromLedgerCurrency(getAccountCurrency(a))) {
      ids.add(id);
    }
  }
  return [...ids];
}

type ResolveRampLedgerIdsParams = Readonly<{
  ledgerIds?: readonly string[];
  marketCurrencyData?: MarketCurrencyData;
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
}>;

export function resolveRampLedgerIds({
  ledgerIds,
  marketCurrencyData,
  distributionItem,
  ledgerCurrency,
}: ResolveRampLedgerIdsParams): string[] {
  if (ledgerIds?.length) {
    return [...ledgerIds];
  }
  if (marketCurrencyData?.ledgerIds?.length) {
    return [...marketCurrencyData.ledgerIds];
  }
  const accounts = distributionItem?.accounts;
  if (accounts?.length) {
    return collectLedgerIdsForRampFromAccounts(accounts);
  }
  if (ledgerCurrency?.id) {
    return ledgerIdsFromLedgerCurrency(ledgerCurrency);
  }
  return [];
}
