import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import {
  getCryptoCurrencyById,
  getTokenById,
} from "@ledgerhq/live-common/currencies/index";

const useCurrency = () => {
  const route: any = useRoute();
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
