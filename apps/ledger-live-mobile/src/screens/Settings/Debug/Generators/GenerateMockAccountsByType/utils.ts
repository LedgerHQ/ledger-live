import { v4 as uuid } from "uuid";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import sample from "lodash/sample";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCurrencyById } from "./constants";

export interface NetworkTokenGroup {
  parentId: string;
  tokens: TokenCurrency[];
}

export function generateCryptoAccounts(currencies: CryptoCurrency[], count: number): Account[] {
  return new Array(count)
    .fill(null)
    .map(() => genAccount(uuid(), { currency: sample(currencies) }));
}

export function generateNetworkTokenAccount(
  currency: CryptoCurrency,
  tokensData: TokenCurrency[],
): Account {
  return genAccount(uuid(), {
    currency,
    tokensData,
    tokenIds: tokensData.map(t => t.id),
    subAccountsCount: tokensData.length,
  });
}

export function buildNetworkTokenAccounts(groups: NetworkTokenGroup[]): Account[] {
  return groups.flatMap(({ parentId, tokens }) => {
    const currency = findCurrencyById(parentId);
    return currency && tokens.length > 0 ? [generateNetworkTokenAccount(currency, tokens)] : [];
  });
}
