import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, TokenAccount } from "@ledgerhq/types-live";

const findAccountByCurrency = (accounts: AccountLike[], currency: CryptoCurrency | TokenCurrency) =>
  accounts.filter(
    (acc: AccountLike) =>
      (acc.type === "Account" ? acc.currency?.id : (acc as TokenAccount).token?.id) === currency.id,
  );

export { findAccountByCurrency };
