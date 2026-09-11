import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { marketApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";
import { hederaApi } from "@ledgerhq/live-common/families/hedera/state-manager/api";
import {
  calApi,
  cardApi,
  coinMarketCapApi,
  countervaluesApi,
  dadaApi,
  pushDevicesApi,
  swapApi,
} from "@shared/api-services";
import { counterValuesApi } from "@ledgerhq/live-common/counterValues/state-manager/api";
// Add new RTK Query API here. `@shared/api-services` entries own one backend each; the endpoints are
// injected by the `@domain/api-*` use-case package that owns them, which the view-models import
// directly.
const APIs = {
  [dadaApi.reducerPath]: dadaApi,
  [calApi.reducerPath]: calApi,
  [cardApi.reducerPath]: cardApi,
  [coinMarketCapApi.reducerPath]: coinMarketCapApi,
  [countervaluesApi.reducerPath]: countervaluesApi,
  [counterValuesApi.reducerPath]: counterValuesApi,
  [cgApi.reducerPath]: cgApi,
  [hederaApi.reducerPath]: hederaApi,
  [marketApi.reducerPath]: marketApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
  [pushDevicesApi.reducerPath]: pushDevicesApi,
  [swapApi.reducerPath]: swapApi,
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
