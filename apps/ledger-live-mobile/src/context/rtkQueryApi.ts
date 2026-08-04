import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { marketApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";
import { calApi, coinMarketCapApi, countervaluesApi, pushDevicesApi } from "@shared/api-services";
import { payCardApi } from "@domain/api-pay-card";
import { counterValuesApi } from "@ledgerhq/live-common/counterValues/state-manager/api";
import { swapQuotesApi } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/api";
// Add new RTK Query API here. `@shared/api-services` entries own one backend each; the endpoints are
// injected by the `@domain/api-*` use-case packages, which the view-models import directly.
const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [calApi.reducerPath]: calApi,
  [coinMarketCapApi.reducerPath]: coinMarketCapApi,
  [countervaluesApi.reducerPath]: countervaluesApi,
  [counterValuesApi.reducerPath]: counterValuesApi,
  [cgApi.reducerPath]: cgApi,
  [marketApi.reducerPath]: marketApi,
  [payCardApi.reducerPath]: payCardApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
  [pushDevicesApi.reducerPath]: pushDevicesApi,
  [swapQuotesApi.reducerPath]: swapQuotesApi,
};

/*
 * Infer redux state type, initial state, reducers, and middlewares from the RTK APIs:
 */

const llmRTKApi = Object.values(APIs);

type RTKApi = { reducer: Reducer; middleware: Middleware };
type ExtractAPIState<APIs> = {
  [K in keyof APIs]: APIs[K] extends RTKApi ? ReturnType<APIs[K]["reducer"]> : never;
};
type ExtractAPIReducers<T> = {
  [K in keyof T]: T[K] extends RTKApi ? T[K]["reducer"] : never;
};

export type LLMRTKApiState = ExtractAPIState<typeof APIs>;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const llmRtkApiInitialStates = Object.fromEntries(
  llmRTKApi.map(api => [api.reducerPath, api.reducer(undefined, { type: "INIT" })]),
) as LLMRTKApiState;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const llmRTKApiReducers = Object.fromEntries(
  llmRTKApi.map(api => [api.reducerPath, api.reducer]),
) as ExtractAPIReducers<typeof APIs>;

export function applyLlmRTKApiMiddlewares<M extends Tuple<Middleware[]>>(middleware: M) {
  return llmRTKApi.reduce<Tuple<Middleware[]>>(
    (middleware, api) => middleware.concat(api.middleware),
    middleware,
  );
}
