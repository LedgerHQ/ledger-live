import { v4 as uuid } from "uuid";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import sample from "lodash/sample";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function generateCryptoAccounts(currencies: CryptoCurrency[], count: number): Account[] {
  return new Array(count)
    .fill(null)
    .map(() => genAccount(uuid(), { currency: sample(currencies) }));
}

export function generateNetworkStablecoinAccount(
  currency: CryptoCurrency,
  tokensData: TokenCurrency[],
): Account {
  return genAccount(uuid(), {
    currency,
    tokensData,
    subAccountsCount: tokensData.length,
  });
}
