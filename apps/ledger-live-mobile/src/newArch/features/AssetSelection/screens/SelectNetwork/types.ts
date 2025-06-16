import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";

export type CryptoWithAccounts = { crypto: CryptoCurrency; accounts: AccountLike[] };
