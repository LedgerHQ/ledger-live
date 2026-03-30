import { useCallback, useMemo, useState } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";

interface CryptoAddressesButtonViewModelResult {
  accountsCount: number;
  hasAccounts: boolean;
  firstThreeCurrencies: (CryptoCurrency | TokenCurrency)[];
  onPress: () => void;
  isAddAccountOpen: boolean;
  onCloseAddAccount: () => void;
}

export function useCryptoAddressesButtonViewModel(): CryptoAddressesButtonViewModelResult {
  const accounts = useSelector(shallowAccountsSelector);
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute();
  const { categorizedAssets } = useCategorizedAssetsFromPortfolio();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const accountsCount = accounts.length;
  const hasAccounts = accountsCount > 0;
  const shouldShowAddAccount = isAddAccountOpen && !hasAccounts;

  const firstThreeCurrencies = useMemo(
    () =>
      [...categorizedAssets.cryptos, ...categorizedAssets.stablecoins]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map(asset => asset.currency),
    [categorizedAssets],
  );

  const onPress = useCallback(() => {
    if (hasAccounts) {
      track("button_clicked", {
        button: "account_cta",
        type: "view",
        page: route.name,
      });

      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.AccountsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        },
      });
    } else {
      track("button_clicked", {
        button: "account_cta",
        type: "add",
        page: route.name,
      });
      setIsAddAccountOpen(true);
    }
  }, [hasAccounts, navigation, route.name]);

  const onCloseAddAccount = useCallback(() => setIsAddAccountOpen(false), []);

  return {
    accountsCount,
    hasAccounts,
    firstThreeCurrencies,
    onPress,
    isAddAccountOpen: shouldShowAddAccount,
    onCloseAddAccount,
  };
}
