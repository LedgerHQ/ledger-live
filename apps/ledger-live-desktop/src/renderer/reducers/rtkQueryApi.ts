import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { pushDevicesApi } from "@ledgerhq/client-ids/api";
import { cryptoBannerApi } from "@ledgerhq/crypto-banner";

// Add new RTK Query API here:
const APIs = {
  [assetsDataApi.reducerPath]: assetsDataApi,
  [cryptoAssetsApi.reducerPath]: cryptoAssetsApi,
  [ofacGeoBlockApi.reducerPath]: ofacGeoBlockApi,
  [pushDevicesApi.reducerPath]: pushDevicesApi,
  [cryptoBannerApi.reducerPath]: cryptoBannerApi,
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
