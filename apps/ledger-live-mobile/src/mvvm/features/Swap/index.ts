import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount, isAccountEmpty } from "@ledgerhq/coin-framework/account/helpers";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
};

type AccountWithParent = {
  account: AccountLike;
  parentAccount?: Account;
};

function getAccountsForCurrency(
  flattenedAccounts: AccountLike[],
  shallowAccounts: Account[],
  currency: CryptoOrTokenCurrency,
): AccountWithParent[] {
  return flattenedAccounts
    .filter(account => {
      const currencyId = account.type === "TokenAccount" ? account.token.id : account.currency.id;
      return currencyId === currency.id && !isAccountEmpty(account);
    })
    .map(account => {
      const parentId = isTokenAccount(account) ? account.parentId : undefined;
      const parent = parentId ? shallowAccounts.find(a => a.id === parentId) : undefined;
      const parentAccount = parent && isAccount(parent) ? parent : undefined;
      return { account, parentAccount };
    });
}

export function useOpenSwap({ currency, sourceScreenName }: UseOpenSwapProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const shallowAccounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const { openDrawer } = useModularDrawerController();

  const accountsForCurrency = useMemo(() => {
    if (!currency) return [];
    return getAccountsForCurrency(flattenedAccounts, shallowAccounts, currency);
  }, [currency, flattenedAccounts, shallowAccounts]);

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

        navigation.navigate(NavigatorName.Swap, {
          screen: ScreenName.SwapTab,
          params: swapParams,
        });
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

      navigation.navigate(NavigatorName.Swap, {
        screen: ScreenName.SwapTab,
        params: swapParams,
      });
    },
    [currency, sourceScreenName, navigation, shallowAccounts],
  );

  const openAccountSelectionDrawer = useCallback(() => {
    openDrawer({
      currencies: currency ? [currency.id] : [],
      flow: "swap",
      source: sourceScreenName,
      areCurrenciesFiltered: !!currency,
      enableAccountSelection: true,
      onAccountSelected: navigateToSwap,
    });
  }, [currency, openDrawer, sourceScreenName, navigateToSwap]);

  const handleOpenSwap = useCallback(() => {
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
  }, [accountsForCurrency, navigateToSwap, openAccountSelectionDrawer]);

  return { handleOpenSwap };
}
