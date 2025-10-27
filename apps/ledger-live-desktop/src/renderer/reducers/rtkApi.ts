import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";

const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
};

export type LLDRTKApiState = ExtractAPIState<typeof APIs>;
const lldRTKApis = Object.values(APIs);

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const lldRTKApiReducers = Object.fromEntries(
  lldRTKApis.map(api => [api.reducerPath, api.reducer]),
) as ExtractAPIReducers<typeof APIs>;

export const lldRTKApiMiddlewares = lldRTKApis.map(api => api.middleware);

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
