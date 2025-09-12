import { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type NavigationProps = StackNavigatorProps<{
  [key: string]: { currencyId: string; currencyType: string };
}>;

const useCurrency = (): CryptoCurrency | TokenCurrency | null => {
  const route = useRoute<NavigationProps["route"]>();
  const { currencyId, currencyType } = route.params;
  const [currency, setCurrency] = useState<CryptoCurrency | TokenCurrency | null>(null);

  useEffect(() => {
    async function loadCurrency() {
      if (currencyType === "CryptoCurrency") {
        const crypto = getCryptoCurrencyById(currencyId);
        setCurrency(crypto);
      } else {
        const token = await getCryptoAssetsStore().findTokenById(currencyId);
        setCurrency(token || null);
      }
    }
    loadCurrency();
  }, [currencyId, currencyType]);

  return currency;
};

export default useCurrency;
