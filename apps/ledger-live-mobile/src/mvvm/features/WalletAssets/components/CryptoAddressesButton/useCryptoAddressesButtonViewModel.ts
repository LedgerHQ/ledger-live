import { useCallback, useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";

interface CryptoAddressesButtonViewModelResult {
  accountsCount: number;
  firstThreeCurrencies: (CryptoCurrency | TokenCurrency)[];
  onPress: () => void;
}

export function useCryptoAddressesButtonViewModel(): CryptoAddressesButtonViewModelResult {
  const accounts = useSelector(shallowAccountsSelector);
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const accountsCount = accounts.length;

  const firstThreeCurrencies = useMemo(() => {
    const seen = new Set<string>();
    const result: (CryptoCurrency | TokenCurrency)[] = [];
    for (const account of accounts) {
      const currency = getAccountCurrency(account);
      if (!seen.has(currency.id)) {
        seen.add(currency.id);
        result.push(currency);
      }
      if (result.length === 3) break;
    }
    return result;
  }, [accounts]);

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "crypto_accounts",
      page: "Wallet",
    });
    navigation.navigate(NavigatorName.Assets, {
      screen: ScreenName.AssetsList,
      params: {
        sourceScreenName: ScreenName.Portfolio,
        showHeader: true,
        isSyncEnabled: true,
      },
    });
  }, [navigation]);

  return { accountsCount, firstThreeCurrencies, onPress };
}
