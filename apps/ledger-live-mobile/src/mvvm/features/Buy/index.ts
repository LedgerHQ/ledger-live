import { useCallback, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";

type UseOpenBuySellProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
};

type AccountWithParent = {
  account: AccountLike;
  parentAccount?: Account;
};

async function getAccountsForCurrency(
  flattenedAccounts: AccountLike[],
  shallowAccounts: Account[],
  currency: CryptoOrTokenCurrency,
): Promise<AccountWithParent[]> {
  const results = await Promise.all(
    flattenedAccounts.map(async account => {
      const currencyId = account.type === "TokenAccount" ? account.token.id : account.currency.id;
      if (currencyId !== currency.id || (await isAccountEmpty(account))) return null;
      const parentId = isTokenAccount(account) ? account.parentId : undefined;
      const parent = parentId ? shallowAccounts.find(a => a.id === parentId) : undefined;
      const parentAccount = parent && isAccount(parent) ? parent : undefined;
      return { account, parentAccount };
    }),
  );
  return results.filter((r): r is AccountWithParent => r !== null);
}

export function useOpenBuySell({ currency, sourceScreenName }: UseOpenBuySellProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const shallowAccounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const { openDrawer } = useModularDrawerController();

  const [accountsForCurrency, setAccountsForCurrency] = useState<AccountWithParent[]>([]);
  useEffect(() => {
    if (!currency) {
      setAccountsForCurrency([]);
      return;
    }
    let cancelled = false;
    getAccountsForCurrency(flattenedAccounts, shallowAccounts, currency).then(accounts => {
      if (!cancelled) setAccountsForCurrency(accounts);
    });
    return () => {
      cancelled = true;
    };
  }, [currency, flattenedAccounts, shallowAccounts]);

  const navigateToBuySell = useCallback(
    (mode: "buy" | "sell", account?: AccountLike, parentAccount?: Account) => {
      const defaultAccountId = account?.id;
      const parentId = isTokenAccount(account)
        ? (parentAccount?.id ?? account.parentId)
        : undefined;

      navigation.navigate(NavigatorName.Exchange, {
        screen: mode === "buy" ? ScreenName.ExchangeBuy : ScreenName.ExchangeSell,
        params: {
          defaultCurrencyId: currency?.id,
          ...(defaultAccountId && { defaultAccountId }),
          ...(parentId && { parentId }),
        },
      });
    },
    [currency, navigation],
  );

  const openAccountSelectionDrawer = useCallback(
    (mode: "buy" | "sell") => {
      openDrawer({
        currencies: currency ? [currency.id] : [],
        flow: mode,
        source: sourceScreenName,
        areCurrenciesFiltered: !!currency,
        enableAccountSelection: true,
        onAccountSelected: (account, parentAccount) =>
          navigateToBuySell(mode, account, parentAccount),
      });
    },
    [currency, openDrawer, sourceScreenName, navigateToBuySell],
  );

  const handleOpenBuySell = useCallback(
    (mode: "buy" | "sell") => {
      const accountCount = accountsForCurrency.length;

      if (accountCount === 0) {
        navigateToBuySell(mode);
        return;
      }

      if (accountCount === 1) {
        const { account, parentAccount } = accountsForCurrency[0];
        navigateToBuySell(mode, account, parentAccount);
        return;
      }

      openAccountSelectionDrawer(mode);
    },
    [accountsForCurrency, navigateToBuySell, openAccountSelectionDrawer],
  );

  return { handleOpenBuySell };
}
