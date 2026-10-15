import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

export function useTransactionsViewModel(
  currency?: CryptoOrTokenCurrency,
  distributionItem?: DistributionItem,
) {
  const allAccounts = useSelector(accountsSelector);

  // Falls back to a native-currency lookup when the asset distribution is not
  // yet available (e.g. async load, or native account with zero balance and
  // past operations). Token currencies still require an explicit
  // `distributionItem` to avoid leaking sibling-token operations.
  const accountIds = useMemo(() => {
    if (distributionItem) return distributionItem.accounts.map(a => a.id);
    if (currency?.type === "CryptoCurrency") {
      return allAccounts.filter(a => a.currency.id === currency.id).map(a => a.id);
    }
    return [];
  }, [distributionItem, currency, allAccounts]);

  return { accountIds, currencyId: currency?.id };
}
