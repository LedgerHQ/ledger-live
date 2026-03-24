import { useCallback, useMemo } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";

interface CryptoAddressesButtonViewModelResult {
  accountsCount: number;
  firstThreeCurrencies: (CryptoCurrency | TokenCurrency)[];
  onPress: () => void;
}

export function useCryptoAddressesButtonViewModel(): CryptoAddressesButtonViewModelResult {
  const accounts = useSelector(shallowAccountsSelector);
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { categorizedAssets } = useCategorizedAssetsFromPortfolio();

  const accountsCount = accounts.length;

  const firstThreeCurrencies = useMemo(() => {
    const allAssets = [...categorizedAssets.cryptos, ...categorizedAssets.stablecoins].sort(
      (a, b) => b.value - a.value,
    );
    const result: (CryptoCurrency | TokenCurrency)[] = [];
    for (const asset of allAssets) {
      result.push(asset.currency);
      if (result.length === 3) break;
    }
    return result;
  }, [categorizedAssets]);

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
