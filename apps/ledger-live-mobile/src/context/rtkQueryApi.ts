import Config from "react-native-config";
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

/** Matches the `SWAP_API_BASE` default in `shared/env`, kept here at the point of use. */
const SWAP_API_BASE_DEFAULT = "https://swap.ledger.com/v5";

/**
 * The `@shared/api-services` backends the app calls. Their endpoints are injected by the
 * `@domain/api-*` use-case packages that own them, which the view-models import directly.
 * Each config thunk runs once, in `createExtra` at store creation.
 */
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
  pushDevicesService(() => ({ pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL") })),
  swapService(() => ({
    // `Config`, not `getEnv`: the `@shared/env` copy only lands after
    // `experimental.ts` awaits the stored envs, long after this read.
    getSwapApiBaseUrl: () => Config.SWAP_API_BASE || SWAP_API_BASE_DEFAULT,
  })),
]);

// Add new legacy RTK Query API here; a new backend goes in `apiServices` instead.
const APIs = {
  [aleoApi.reducerPath]: aleoApi,
  [cgApi.reducerPath]: cgApi,
  [hederaApi.reducerPath]: hederaApi,
  [marketApi.reducerPath]: marketApi,
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

export type LLMRTKApiState = ExtractAPIState<typeof APIs> & ApiServicesState<typeof apiServices>;

export const llmRTKApiReducers = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ...(Object.fromEntries(
    llmRTKApi.map(api => [api.reducerPath, api.reducer]),
  ) as ExtractAPIReducers<typeof APIs>),
  ...apiServices.reducers,
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const llmRtkApiInitialStates = Object.fromEntries(
  Object.entries<Reducer>(llmRTKApiReducers).map(([reducerPath, reducer]) => [
    reducerPath,
    reducer(undefined, { type: "INIT" }),
  ]),
) as LLMRTKApiState;

export function applyLlmRTKApiMiddlewares<M extends Tuple<Middleware[]>>(middleware: M) {
  return llmRTKApi
    .reduce<Tuple<Middleware[]>>((middleware, api) => middleware.concat(api.middleware), middleware)
    .concat(apiServices.middlewares);
}
