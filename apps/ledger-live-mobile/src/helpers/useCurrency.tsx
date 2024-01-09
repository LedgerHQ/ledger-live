import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/live-common/currencies/index";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<{
  [key: string]: { currencyId: string; currencyType: string };
}>;

const useCurrency = () => {
  const route = useRoute<NavigationProps["route"]>();
  const { currencyId, currencyType } = route.params;
  return useMemo(
    () =>
      currencyType === "CryptoCurrency"
        ? getCryptoCurrencyById(currencyId)
        : getTokenById(currencyId),
    [currencyId, currencyType],
  );
};

export default useCurrency;
