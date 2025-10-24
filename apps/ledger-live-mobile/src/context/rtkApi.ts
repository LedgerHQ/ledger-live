import { Middleware, Tuple } from "@reduxjs/toolkit";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { firebaseRemoteConfigApi } from "LLM/api/firebaseRemoteConfigApi";

const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
  [firebaseRemoteConfigApi.reducerPath]: firebaseRemoteConfigApi,
};

export type LLMRTKApiState = ExtractAPIState<typeof APIs>;
const llmRTKApi = Object.values(APIs);

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const llmRTKApiReducers = Object.fromEntries(
  llmRTKApi.map(api => [api.reducerPath, api.reducer]),
) as ExtractAPIReducers<typeof APIs>;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const llmRtkApiInitialStates = Object.fromEntries(
  llmRTKApi.map(api => [api.reducerPath, api.reducer(undefined, { type: "INIT" })]),
) as LLMRTKApiState;

export function applyLlmRTKApiMiddlewares<M extends Tuple<Middleware[]>>(middleware: M) {
  return llmRTKApi.reduce(
    (middleware: Tuple<Middleware[]>, api) => middleware.concat(api.middleware),
    middleware,
  );
}

type ExtractAPIState<APIs> = {
  [K in keyof APIs]: APIs[K] extends {
    reducerPath: string;
    reducer: (...args: never[]) => unknown;
  }
    ? ReturnType<APIs[K]["reducer"]>
    : never;
};

type ExtractAPIReducers<T> = {
  [K in keyof T]: T[K] extends { reducerPath: string; reducer: (...args: never[]) => unknown }
    ? T[K]["reducer"]
    : never;
};
