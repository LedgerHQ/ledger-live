import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";

type UseMyAccountsSectionViewModelProps = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  currentAccountId: string;
}>;

export function useMyAccountsSectionViewModel({
  currency,
  currentAccountId,
}: UseMyAccountsSectionViewModelProps) {
  const allAccounts = useSelector(accountsSelector);

  const userAccountsForCurrency = useMemo(() => {
    return allAccounts.filter(acc => {
      if (acc.id === currentAccountId) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, currentAccountId]);

  const accountNames = useBatchMaybeAccountName(userAccountsForCurrency);

  return {
    userAccountsForCurrency,
    accountNames,
  };
}
