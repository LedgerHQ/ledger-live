import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountCurrency, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useModularDrawerController } from "../ModularDrawer";
import { getAccountsForCurrencies, resolveCurrencyIds } from "../Exchange";

const ASSET_DETAIL_SOURCE_SCREEN_NAME = "Asset Detail";

type UseOpenBuySellProps = {
  currency?: CryptoOrTokenCurrency;
  /**
   * When non-empty, takes priority over `currency` so a multi-network asset
   * (e.g. ETH on Ethereum + Base + Arbitrum) opens the network-selection step.
   */
  currencyIds?: string[];
  sourceScreenName: string;
};

export function useOpenBuySell({ currency, currencyIds, sourceScreenName }: UseOpenBuySellProps) {
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

  const navigateToBuySell = useCallback(
    (mode: "buy" | "sell", account?: AccountLike, parentAccount?: Account) => {
      const defaultAccountId = account?.id;
      const parentId = isTokenAccount(account)
        ? (parentAccount?.id ?? account.parentId)
        : undefined;
      const defaultCurrencyId = account ? getAccountCurrency(account).id : currency?.id;

      navigation.navigate(NavigatorName.Exchange, {
        screen: mode === "buy" ? ScreenName.ExchangeBuy : ScreenName.ExchangeSell,
        params: {
          defaultCurrencyId,
          ...(defaultAccountId && { defaultAccountId }),
          ...(parentId && { parentId }),
          ...(sourceScreenName === ASSET_DETAIL_SOURCE_SCREEN_NAME && {
            returnToPreviousScreenOnClose: true,
          }),
          ...(!account && { goBackOnAccountRequestCancel: true }),
        },
      });
    },
    [currency, navigation, sourceScreenName],
  );

  const openAccountSelectionDrawer = useCallback(
    (mode: "buy" | "sell") => {
      openDrawer({
        currencies: resolvedCurrencyIds,
        flow: mode,
        source: sourceScreenName,
        areCurrenciesFiltered: resolvedCurrencyIds.length > 0,
        enableAccountSelection: true,
        onAccountSelected: (account, parentAccount) =>
          navigateToBuySell(mode, account, parentAccount),
      });
    },
    [resolvedCurrencyIds, openDrawer, sourceScreenName, navigateToBuySell],
  );

  const handleOpenBuySell = useCallback(
    (mode: "buy" | "sell") => {
      // Multi-network assets always open the drawer so the user can pick network → account.
      if (resolvedCurrencyIds.length > 1) {
        openAccountSelectionDrawer(mode);
        return;
      }

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
    [
      resolvedCurrencyIds.length,
      accountsForCurrency,
      navigateToBuySell,
      openAccountSelectionDrawer,
    ],
  );

  return { handleOpenBuySell };
}
