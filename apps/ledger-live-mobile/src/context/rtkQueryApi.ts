import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { marketApi, countervaluesApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { firebaseRemoteConfigApi } from "LLM/api/firebaseRemoteConfigApi";
import { pushDevicesApi } from "@ledgerhq/client-ids/api";
import { cmcApi } from "@ledgerhq/live-common/cmc-client/state-manager/api";
import { countervaluesByMarketcapApi } from "@ledgerhq/live-countervalues-react/api";

// Add new RTK Query API here:
const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [cmcApi.reducerPath]: cmcApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
  [firebaseRemoteConfigApi.reducerPath]: firebaseRemoteConfigApi,
  [marketApi.reducerPath]: marketApi,
  [countervaluesApi.reducerPath]: countervaluesApi,
  [countervaluesByMarketcapApi.reducerPath]: countervaluesByMarketcapApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
  [pushDevicesApi.reducerPath]: pushDevicesApi,
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
