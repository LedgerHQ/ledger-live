import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { getCryptoCurrencyById, findTokenById } from "@ledgerhq/live-common/currencies/index";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<{
  [key: string]: { currencyId: string; currencyType: string };
}>;

const useCurrency = () => {
  const route = useRoute<NavigationProps["route"]>();
  const { currencyId, currencyType } = route.params;
  return useMemo(() => {
    if (currencyType === "CryptoCurrency") {
      return getCryptoCurrencyById(currencyId);
    }
    const token = findTokenById(currencyId);
    if (!token) {
      throw new Error(`token with id "${currencyId}" not found`);
    }
    return token;
  }, [currencyId, currencyType]);
};

export default useCurrency;
