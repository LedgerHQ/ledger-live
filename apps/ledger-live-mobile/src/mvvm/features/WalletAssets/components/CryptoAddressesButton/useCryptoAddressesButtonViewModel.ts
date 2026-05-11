import { useCallback, useState } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";

interface CryptoAddressesButtonViewModelResult {
  accountsCount: number;
  hasAccounts: boolean;
  firstThreeCurrencies: (CryptoCurrency | TokenCurrency)[];
  moreAccountsCount: number;
  onPress: () => void;
  isAddAccountOpen: boolean;
  onCloseAddAccount: () => void;
}

const MAX_ACCOUNTS_TO_DISPLAY = 3;
const MAX_MORE_ACCOUNTS_DISPLAY = 99;

export function useCryptoAddressesButtonViewModel(): CryptoAddressesButtonViewModelResult {
  const accounts = useSelector(shallowAccountsSelector);
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const accountsCount = accounts.length;
  const hasAccounts = accountsCount > 0;
  const shouldShowAddAccount = isAddAccountOpen && !hasAccounts;

  const firstThreeCurrencies = [...new Set(accounts.map(a => getAccountCurrency(a)))].slice(
    0,
    MAX_ACCOUNTS_TO_DISPLAY,
  );

  const onPress = useCallback(() => {
    if (hasAccounts) {
      track("button_clicked", {
        button: "account_cta",
        type: "view",
        page: route.name,
      });

      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.CryptoAddresses,
        params: {
          sourceScreenName: ScreenName.Portfolio,
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

  const moreAccountsCount = Math.min(
    Math.max(0, accountsCount - MAX_ACCOUNTS_TO_DISPLAY),
    MAX_MORE_ACCOUNTS_DISPLAY,
  );

  return {
    accountsCount,
    hasAccounts,
    firstThreeCurrencies,
    moreAccountsCount,
    onPress,
    isAddAccountOpen: shouldShowAddAccount,
    onCloseAddAccount,
  };
}
