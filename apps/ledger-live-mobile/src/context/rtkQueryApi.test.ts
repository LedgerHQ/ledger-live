import { Tuple, type Middleware } from "@reduxjs/toolkit";
import { marketApi } from "@ledgerhq/live-common/market/state-manager/api";
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";
import { aleoApi } from "@ledgerhq/live-common/families/aleo/state-manager/api";
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
import {
  applyLlmRTKApiMiddlewares,
  llmRtkApiInitialStates,
  llmRTKApiReducers,
} from "./rtkQueryApi";

/**
 * The registry keys itself off each api's `reducerPath`, so a wrong import, a duplicated backend or a
 * dropped api changes the store shape without failing typecheck. Pinning the exact set is the only
 * thing that catches it.
 *
 * `@shared/api-services` entries own one backend each; their endpoints are injected by the
 * matching `@domain/api-*` use-case packages, which the view-models import directly.
 */
const EXPECTED_REDUCER_PATHS = [
  "aleoApi",
  "assetsDataApi",
  "calApi",
  "cardApi",
  "cgApi",
  "coinMarketCapApi",
  "countervaluesApi",
  "hederaApi",
  "marketApi",
  "pushDevicesApi",
  "swapApi",
] as const;

const EXPECTED_APIS = [
  aleoApi,
  dadaApi,
  calApi,
  cardApi,
  coinMarketCapApi,
  countervaluesApi,
  cgApi,
  hederaApi,
  marketApi,
  pushDevicesApi,
  swapApi,
];

describe("llmRTKApiReducers", () => {
  it("registers exactly the expected reducer paths", () => {
    expect(Object.keys(llmRTKApiReducers).sort()).toEqual([...EXPECTED_REDUCER_PATHS]);
  });

  it("registers one reducer per backend, with no duplicates", () => {
    const paths = Object.keys(llmRTKApiReducers);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("registers each api's own reducer under its reducer path", () => {
    for (const api of EXPECTED_APIS) {
      expect(llmRTKApiReducers[api.reducerPath]).toBe(api.reducer);
    }
  });
});

describe("llmRtkApiInitialStates", () => {
  it("holds each api's initial state under its reducer path", () => {
    expect(Object.keys(llmRtkApiInitialStates).sort()).toEqual([...EXPECTED_REDUCER_PATHS]);
    for (const api of EXPECTED_APIS) {
      expect(llmRtkApiInitialStates[api.reducerPath]).toEqual(
        api.reducer(undefined, { type: "INIT" }),
      );
    }
  });
});

const passThrough: Middleware = () => next => action => next(action);

describe("applyLlmRTKApiMiddlewares", () => {
  it("appends exactly the middleware of each expected api, once", () => {
    const [first, ...apiMiddlewares] = applyLlmRTKApiMiddlewares(new Tuple(passThrough));

    expect(first).toBe(passThrough);
    expect(apiMiddlewares).toHaveLength(EXPECTED_APIS.length);
    expect(new Set(apiMiddlewares)).toEqual(new Set(EXPECTED_APIS.map(api => api.middleware)));
  });
});

describe("apiServices", () => {
  it("reads no app config before createExtra runs", () => {
    jest.isolateModules(() => {
      // The legacy apis read their env at import; only the services are under test here.
      for (const [path, name] of LEGACY_API_MODULES) {
        jest.doMock(path, () => ({ [name]: stubApi(name) }));
      }
      jest.doMock("@shared/env", () => ({
        ...jest.requireActual("@shared/env"),
        getEnv: (name: string) => {
          throw new Error(`getEnv("${name}") was called`);
        },
      }));

      let module: typeof import("./rtkQueryApi") | undefined;
      expect(() => {
        module = require("./rtkQueryApi");
      }).not.toThrow();
      expect(() => module?.apiServices.createExtra({ ledgerClientVersion: "1.0.0" })).toThrow(
        'getEnv("CAL_SERVICE_URL") was called',
      );
    });
  });
});

const LEGACY_API_MODULES = [
  ["@ledgerhq/live-common/market/state-manager/api", "marketApi"],
  ["@ledgerhq/live-common/cg-client/state-manager/api", "cgApi"],
  ["@ledgerhq/live-common/families/aleo/state-manager/api", "aleoApi"],
  ["@ledgerhq/live-common/families/hedera/state-manager/api", "hederaApi"],
] as const;

function stubApi(reducerPath: string) {
  return { reducerPath, reducer: () => ({}), middleware: passThrough };
}
