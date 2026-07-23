import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { marketApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { currencyFiatApi } from "@domain/api-currency-fiat";
import { marketSentimentApi } from "@domain/api-market-sentiment";
import { altcoinsSentimentApi } from "@domain/api-altcoins-sentiment";
import { payCardApi } from "@domain/api-pay-card";
import { pushDevicesApi } from "@domain/api-push-devices";
import { counterValuesApi } from "@ledgerhq/live-common/counterValues/state-manager/api";

// Add new RTK Query API here:
const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [marketSentimentApi.reducerPath]: marketSentimentApi,
  [altcoinsSentimentApi.reducerPath]: altcoinsSentimentApi,
  [counterValuesApi.reducerPath]: counterValuesApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
  [currencyFiatApi.reducerPath]: currencyFiatApi,
  [marketApi.reducerPath]: marketApi,
  [cgApi.reducerPath]: cgApi,
  [payCardApi.reducerPath]: payCardApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
  [pushDevicesApi.reducerPath]: pushDevicesApi,
};

/*
 * Infer redux state type, reducers, and middlewares from the RTK APIs:
 */

const lldRTKApis = Object.values(APIs);

type RTKApi = { reducer: Reducer; middleware: Middleware };
type ExtractAPIState<APIs> = {
  [K in keyof APIs]: APIs[K] extends RTKApi ? ReturnType<APIs[K]["reducer"]> : never;
};
type ExtractAPIReducers<T> = {
  [K in keyof T]: T[K] extends RTKApi ? T[K]["reducer"] : never;
};

export type LLDRTKApiState = ExtractAPIState<typeof APIs>;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const lldRTKApiReducers = Object.fromEntries(
  lldRTKApis.map(api => [api.reducerPath, api.reducer]),
) as ExtractAPIReducers<typeof APIs>;

export function applyLldRTKApiMiddlewares<M extends Tuple<Middleware[]>>(middleware: M) {
  return lldRTKApis.reduce<Tuple<Middleware[]>>(
    (middleware, api) => middleware.concat(api.middleware),
    middleware,
  );
}
