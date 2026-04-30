import { useCallback, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
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

export function useOpenSwap({
  currency,
  sourceScreenName,
  defaultAccount,
  defaultParentAccount,
}: UseOpenSwapProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
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

  const navigateToSwap = useCallback(
    async (account?: AccountLike, parentAccount?: Account) => {
      const baseParams: DefaultAccountSwapParamList = {
        defaultCurrency: currency,
        fromPath: sourceScreenName,
      };

      if (!account || (await isAccountEmpty(account))) {
        const swapParams: DefaultAccountSwapParamList = {
          ...baseParams,
          ...(currency && isTokenCurrency(currency) && { toTokenId: currency.id }),
        };

        if (shouldDisplayWallet40MainNav) {
          navigation.navigate(NavigatorName.Main, {
            screen: NavigatorName.Swap,
            params: {
              screen: ScreenName.SwapTab,
              params: swapParams,
            },
          });
        } else {
          navigation.navigate(NavigatorName.Swap, {
            screen: ScreenName.SwapTab,
            params: swapParams,
          });
        }
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

      if (shouldDisplayWallet40MainNav) {
        navigation.navigate(NavigatorName.Main, {
          screen: NavigatorName.Swap,
          params: {
            screen: ScreenName.SwapTab,
            params: swapParams,
          },
        });
      } else {
        navigation.navigate(NavigatorName.Swap, {
          screen: ScreenName.SwapTab,
          params: swapParams,
        });
      }
    },
    [currency, sourceScreenName, shallowAccounts, navigation, shouldDisplayWallet40MainNav],
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

  const handleOpenSwap = useCallback(async () => {
    if (defaultAccount && !(await isAccountEmpty(defaultAccount))) {
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

    openAccountSelectionDrawer();
  }, [
    accountsForCurrency,
    defaultAccount,
    defaultParentAccount,
    navigateToSwap,
    openAccountSelectionDrawer,
  ]);

  return { handleOpenSwap };
}
