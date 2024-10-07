import { Account, SubAccount } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
export type AccountTuple = {
  account: Account;
  subAccount: SubAccount | undefined | null;
};
export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean | null,
  accountIds?: Map<string, boolean>,
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter(account => {
        // not checking subAccounts against accountIds for TokenCurrency
        // because the wallet-api is not able to setup empty accounts
        // for all parentAccounts and currencies we support
        // and we would lose the empty token accounts in the drawer
        return account.currency.id === currency.parentCurrency.id;
      })
      .map(account => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: SubAccount) =>
                subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter(a => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }
  return allAccounts
    .filter(
      account =>
        account.currency.id === currency.id && (accountIds ? accountIds.has(account.id) : true),
    )
    .map(account => ({
      account,
      subAccount: null,
    }))
    .filter(a => (hideEmpty ? a.account?.balance.gt(0) : true));
}

export type UseCurrencyAccountSelectReturnType<
  C extends CryptoOrTokenCurrency = CryptoOrTokenCurrency,
> = {
  availableAccounts: Array<AccountTuple>;
  currency: C | undefined | null;
  account: Account | undefined | null;
  subAccount: SubAccount | undefined | null;
  setAccount: (account?: Account | null, subAccount?: SubAccount | null) => void;
  setCurrency: (currency?: C | null) => void;
};
