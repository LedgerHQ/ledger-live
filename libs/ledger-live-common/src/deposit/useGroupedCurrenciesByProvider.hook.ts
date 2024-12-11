import { GroupedCurrencies, LoadingBasedGroupedCurrencies } from "./type";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useMemo, useState } from "react";
import { isCurrencySupported, listSupportedCurrencies, listTokens } from "../currencies";
import { loadCurrenciesByProvider } from "./helper";

// FIXME(LIVE-10505): bad performane & shared utility to move to coin-framework
const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const initialResult: GroupedCurrencies = {
  sortedCryptoCurrencies: [],
  currenciesByProvider: [],
};

export const useGroupedCurrenciesByProvider = (
  withLoading?: boolean,
): GroupedCurrencies | LoadingBasedGroupedCurrencies => {
  const [result, setResult] = useState(initialResult);

  const [loadingStatus, setLoadingStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const coinsAndTokensSupported = useMemo(
    () => (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
    [],
  );

  // Get mapped assets filtered by supported & sorted currencies, grouped by provider id
  useEffect(() => {
    if (withLoading) {
      setLoadingStatus("pending");
      loadCurrenciesByProvider(coinsAndTokensSupported)
        .then(data => {
          setResult(data);
          setLoadingStatus("success");
        })
        .catch(() => setLoadingStatus("error"));
    } else {
      loadCurrenciesByProvider(coinsAndTokensSupported).then(setResult);
    }
  }, [coinsAndTokensSupported, withLoading]);
  return withLoading ? { result, loadingStatus } : result;
};
