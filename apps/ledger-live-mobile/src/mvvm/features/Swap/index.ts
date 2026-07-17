import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount, isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  ledgerIds?: string[];
};

type AccountWithParent = {
  account: AccountLike;
  parentAccount?: Account;
};

function getAccountsForCurrencies(
  flattenedAccounts: AccountLike[],
  shallowAccounts: Account[],
  currencyIds: string[],
): AccountWithParent[] {
  const ids = new Set(currencyIds);
  return flattenedAccounts
    .filter(account => {
      const currencyId = account.type === "TokenAccount" ? account.token.id : account.currency.id;
      return ids.has(currencyId) && !isAccountEmpty(account);
    })
    .map(account => {
      const parentId = isTokenAccount(account) ? account.parentId : undefined;
      const parent = parentId ? shallowAccounts.find(a => a.id === parentId) : undefined;
      const parentAccount = parent && isAccount(parent) ? parent : undefined;
      return { account, parentAccount };
    });
}

export function useOpenSwap({
  currency,
  sourceScreenName,
  defaultAccount,
  defaultParentAccount,
  ledgerIds,
}: UseOpenSwapProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const shallowAccounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const { openDrawer } = useModularDrawerController();

  const currencyIds = useMemo(
    () => ledgerIds ?? (currency ? [currency.id] : []),
    [currency, ledgerIds],
  );

  const accountsForCurrency = useMemo(
    () => getAccountsForCurrencies(flattenedAccounts, shallowAccounts, currencyIds),
    [currencyIds, flattenedAccounts, shallowAccounts],
  );

  const navigateToSwap = useCallback(
    (account?: AccountLike, parentAccount?: Account) => {
      const baseParams: DefaultAccountSwapParamList = {
        defaultCurrency: currency,
        fromPath: sourceScreenName,
      };

      if (!account || isAccountEmpty(account)) {
        const swapParams: DefaultAccountSwapParamList = {
          ...baseParams,
          ...(currency && isTokenCurrency(currency) && { toTokenId: currency.id }),
        };

        navigateToSwapTab({ navigation, params: swapParams });
        return;
      }

      const parentId = isTokenAccount(account) ? account.parentId : undefined;
      const parent = parentAccount
        ? parentAccount
        : parentId
          ? shallowAccounts.find(a => a.id === parentId)
          : undefined;
      const parentAcc = parent && isAccount(parent) ? parent : undefined;

      const swapParams: DefaultAccountSwapParamList = {
        ...baseParams,
        defaultAccount: account,
        defaultParentAccount: parentAcc,
      };

      navigateToSwapTab({ navigation, params: swapParams });
    },
    [currency, sourceScreenName, shallowAccounts, navigation],
  );

  const openCurrencyDrawer = useCallback(() => {
    openDrawer({
      currencies: currencyIds,
      flow: "swap",
      source: sourceScreenName,
      areCurrenciesFiltered: currencyIds.length > 0,
      enableAccountSelection: true,
      onAccountSelected: navigateToSwap,
    });
  }, [currencyIds, openDrawer, sourceScreenName, navigateToSwap]);

  const handleOpenSwap = useCallback(() => {
    if (defaultAccount && !isAccountEmpty(defaultAccount)) {
      navigateToSwap(defaultAccount, defaultParentAccount);
      return;
    }

    const accountCount = accountsForCurrency.length;

    if (accountCount === 0) {
      navigateToSwap();
      return;
    }

    if (accountCount === 1) {
      const { account, parentAccount } = accountsForCurrency[0];
      navigateToSwap(account, parentAccount);
      return;
    }

    openCurrencyDrawer();
  }, [
    accountsForCurrency,
    defaultAccount,
    defaultParentAccount,
    navigateToSwap,
    openCurrencyDrawer,
  ]);

  return { handleOpenSwap };
}
