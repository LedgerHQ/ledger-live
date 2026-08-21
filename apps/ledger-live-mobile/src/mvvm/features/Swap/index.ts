import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount, isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { getAccountsForCurrencies, resolveCurrencyIds } from "../Exchange";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  /**
   * When non-empty, takes priority over `currency` so a multi-network asset
   * (e.g. ETH on Ethereum + Base + Arbitrum) opens the network-selection step.
   */
  currencyIds?: string[];
  sourceScreenName: string;
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
};

export function useOpenSwap({
  currency,
  currencyIds,
  sourceScreenName,
  defaultAccount,
  defaultParentAccount,
}: UseOpenSwapProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const shallowAccounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const { openDrawer } = useModularDrawerController();

  const resolvedCurrencyIds = useMemo(
    () => resolveCurrencyIds(currency, currencyIds),
    [currency, currencyIds],
  );

  const accountsForCurrency = useMemo(() => {
    if (!resolvedCurrencyIds.length) return [];
    return getAccountsForCurrencies(flattenedAccounts, shallowAccounts, resolvedCurrencyIds);
  }, [resolvedCurrencyIds, flattenedAccounts, shallowAccounts]);

  const navigateToSwap = useCallback(
    (account?: AccountLike, parentAccount?: Account) => {
      const selectedCurrency = account ? getAccountCurrency(account) : currency;
      const baseParams: DefaultAccountSwapParamList = {
        defaultCurrency: selectedCurrency,
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

  const openAccountSelectionDrawer = useCallback(() => {
    openDrawer({
      currencies: resolvedCurrencyIds,
      flow: "swap",
      source: sourceScreenName,
      areCurrenciesFiltered: resolvedCurrencyIds.length > 0,
      enableAccountSelection: true,
      onAccountSelected: navigateToSwap,
    });
  }, [resolvedCurrencyIds, openDrawer, sourceScreenName, navigateToSwap]);

  const handleOpenSwap = useCallback(() => {
    if (defaultAccount && !isAccountEmpty(defaultAccount)) {
      navigateToSwap(defaultAccount, defaultParentAccount);
      return;
    }

    // Multi-network assets always open the drawer so the user can pick network → account.
    if (resolvedCurrencyIds.length > 1) {
      openAccountSelectionDrawer();
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

    openAccountSelectionDrawer();
  }, [
    accountsForCurrency,
    defaultAccount,
    defaultParentAccount,
    resolvedCurrencyIds.length,
    navigateToSwap,
    openAccountSelectionDrawer,
  ]);

  return { handleOpenSwap };
}
