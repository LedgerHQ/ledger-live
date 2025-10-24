import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";

// There is a typescript error without this import
import type {} from "@reduxjs/toolkit";
import type {} from "@reduxjs/toolkit/query/react";

const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
};

export type LLDRTKApiState = ExtractAPIState<typeof APIs>;
const lldRTKApis = Object.values(APIs);

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const lldRTKApiReducers = Object.fromEntries(
  lldRTKApis.map(api => [api.reducerPath, api.reducer]),
) as ExtractAPIReducers<typeof APIs>;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const lldRTKApiMiddlewares = lldRTKApis.map(api => [api.reducerPath, api.reducer]);

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
