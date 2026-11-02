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
  portfolioApi,
  pushDevicesApi,
  swapApi,
} from "@shared/api-services";
import { applyLldRTKApiMiddlewares, lldRTKApiReducers } from "./rtkQueryApi";

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
  "portfolioApi",
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
  marketApi,
  cgApi,
  hederaApi,
  portfolioApi,
  pushDevicesApi,
  swapApi,
];

describe("lldRTKApiReducers", () => {
  it("registers exactly the expected reducer paths", () => {
    expect(Object.keys(lldRTKApiReducers).sort()).toEqual([...EXPECTED_REDUCER_PATHS]);
  });

  it("registers one reducer per backend, with no duplicates", () => {
    const paths = Object.keys(lldRTKApiReducers);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("registers each api's own reducer under its reducer path", () => {
    for (const api of EXPECTED_APIS) {
      expect(lldRTKApiReducers[api.reducerPath]).toBe(api.reducer);
    }
  });
});

const appMiddleware: Middleware = () => next => action => next(action);

const stubApi = (reducerPath: string) => ({
  [reducerPath]: { reducerPath, reducer: jest.fn(), middleware: jest.fn() },
});

describe("applyLldRTKApiMiddlewares", () => {
  it("appends exactly the middleware of each expected api, once", () => {
    const [first, ...apiMiddlewares] = applyLldRTKApiMiddlewares(new Tuple(appMiddleware));

    expect(first).toBe(appMiddleware);
    expect(apiMiddlewares).toHaveLength(EXPECTED_APIS.length);
    expect(new Set(apiMiddlewares)).toEqual(new Set(EXPECTED_APIS.map(api => api.middleware)));
  });
});

describe("apiServices", () => {
  it("reads no app config before createExtra runs", () => {
    jest.isolateModules(() => {
      // Some legacy apis read their URL at import; none of them is one of `apiServices`.
      jest.doMock("@ledgerhq/live-common/market/state-manager/api", () => stubApi("marketApi"));
      jest.doMock("@ledgerhq/live-common/cg-client/state-manager/api", () => stubApi("cgApi"));
      jest.doMock("@ledgerhq/live-common/families/aleo/state-manager/api", () =>
        stubApi("aleoApi"),
      );
      jest.doMock("@ledgerhq/live-common/families/hedera/state-manager/api", () =>
        stubApi("hederaApi"),
      );
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
