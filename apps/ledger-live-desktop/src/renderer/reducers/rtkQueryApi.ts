import type { Middleware, Reducer, Tuple } from "@reduxjs/toolkit";
import { marketApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";
import { aleoApi } from "@ledgerhq/live-common/families/aleo/state-manager/api";
import { hederaApi } from "@ledgerhq/live-common/families/hedera/state-manager/api";
import {
  calService,
  cardService,
  coinMarketCapService,
  cvsService,
  dadaService,
  defineApiServices,
  portfolioService,
  pushDevicesService,
  swapService,
  type ApiServicesState,
} from "@shared/api-services";
import { getEnv } from "@shared/env";
import {
  isCardSessionCurrent,
  isCardUsEnv,
  readCardSession,
  refreshCardSession,
} from "@features/platform-card";
import { getPortfolioServiceUrl } from "~/config/portfolioService";

// Add new RTK Query API here. `@shared/api-services` entries own one backend each; the endpoints are
// injected by the `@domain/api-*` use-case package that owns them, which the view-models import
// directly.
export const apiServices = defineApiServices([
  calService(() => ({ calServiceUrl: getEnv("CAL_SERVICE_URL") })),
  cardService(() => ({
    // Read on every request, so the debug settings can change them without a restart.
    getCardApiBaseUrl: () => getEnv("CARD_BAANX_API_URL"),
    getCardBaanxClientKey: () => getEnv("CARD_BAANX_CLIENT_KEY"),
    isCardUsEnv: () => isCardUsEnv(getEnv("CARD_BAANX_US_APP_ID")),
    readCardSession,
    isCardSessionCurrent,
    refreshCardSession,
  })),
  coinMarketCapService(() => ({ coinMarketCapApiUrl: getEnv("CMC_API_URL") })),
  cvsService(() => ({ getCountervaluesServiceUrl: () => getEnv("LEDGER_COUNTERVALUES_API") })),
  dadaService(),
  // POC, dev only: empty disables the service.
  portfolioService(() => ({ portfolioServiceUrl: getPortfolioServiceUrl() })),
  pushDevicesService(() => ({ pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL") })),
  // Read on every request, so the debug settings can change it without a restart.
  swapService(() => ({ getSwapApiBaseUrl: () => getEnv("SWAP_API_BASE") })),
]);

const APIs = {
  [aleoApi.reducerPath]: aleoApi,
  [marketApi.reducerPath]: marketApi,
  [cgApi.reducerPath]: cgApi,
  [hederaApi.reducerPath]: hederaApi,
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

export type LLDRTKApiState = ExtractAPIState<typeof APIs> & ApiServicesState<typeof apiServices>;

export const lldRTKApiReducers = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ...(Object.fromEntries(
    lldRTKApis.map(api => [api.reducerPath, api.reducer]),
  ) as ExtractAPIReducers<typeof APIs>),
  ...apiServices.reducers,
};

export function applyLldRTKApiMiddlewares<M extends Tuple<Middleware[]>>(middleware: M) {
  return lldRTKApis
    .reduce<Tuple<Middleware[]>>((applied, api) => applied.concat(api.middleware), middleware)
    .concat(apiServices.middlewares);
}
