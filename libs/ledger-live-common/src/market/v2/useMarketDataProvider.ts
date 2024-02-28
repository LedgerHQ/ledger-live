import { useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchCurrencyData,
  supportedCounterCurrencies,
} from "../api/api";
import { MarketCurrencyRequestParams } from "../types";
import { QUERY_KEY } from "./queryKeys";

// 3min
const STALE_TIME = 3 * 60000;
// export function useMarketDataProvider() {
//   // TO DO
//   // api.setSupportedCoinsList()

//   const { isPending, error, data, isFetching } = useQuery({
//     queryKey: [QUERY_KEY.SupportedCounterCurrencies],
//     queryFn: () => supportedCounterCurrencies(),
//   });

//   // useEffect(() => {
//   //   if (countervalue) {
//   //     const ticker = countervalue.ticker.toLowerCase();
//   //     api.supportedCounterCurrencies().then(
//   //       supportedCounterCurrencies =>
//   //       .then((coins: SupportedCoins) => {
//   //           dispatch({
//   //             type: ACTIONS.IS_READY,
//   //             payload: {
//   //               totalCoinsAvailable: coins.length,
//   //               supportedCounterCurrencies,
//   //             },
//   //           });
//   //           dispatch({
//   //             type: ACTIONS.UPDATE_COUNTERVALUE,
//   //             payload: supportedCounterCurrencies.includes(ticker) ? ticker : "usd",
//   //           });
//   //         }, handleError),
//   //       handleError,
//   //     );
//   //   }
//   // }, [api, countervalue, handleError]);
// }

export function useCurrencyChartData({ id, counterCurrency, ranges }: MarketCurrencyRequestParams) {
  const results = useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id }),
      staleTime: STALE_TIME,
    })),
  });

  return results;
}

export function useCurrencyData({ id, counterCurrency, ranges }: MarketCurrencyRequestParams) {
  const results = useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyData({ counterCurrency, range, id }),
      staleTime: STALE_TIME,
    })),
  });

  const resultCurrency = useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id],
    queryFn: () => fetchCurrency({ id }),
    staleTime: STALE_TIME,
  });

  return { currencyDataByRanges: results, currencyInfo: resultCurrency };
}

export function useSupportedCounterCurrencies() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [QUERY_KEY.SupportedCounterCurrencies],
    queryFn: () => supportedCounterCurrencies(),
  });

  return {
    isPending,
    error,
    data,
    isFetching,
  };
}
