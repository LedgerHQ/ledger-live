import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { getAuthProvider } from "@shared/auth";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { liveAuthentication } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { setOverride } from "@shared/feature-flags";

jest.mock("~/config/bridge-setup", () => ({
  setupCryptoAssetsStore: jest.fn(),
  setupRateLookups: jest.fn(),
}));

jest.mock("@domain/entity-recent-addresses", () => ({
  ...jest.requireActual("@domain/entity-recent-addresses"),
  connectRecentAddressesStore: jest.fn(),
}));

jest.mock(
  "@ledgerhq/live-engagement/largeScreenUpsellModal",
  () => ({
    largeScreenUpsellModalReducer: (state = {}) => state,
  }),
  { virtual: true },
);

jest.mock(
  "@ledgerhq/live-dmk-mobile",
  () => ({
    findMatchingOldDevice: jest.fn(() => null),
    setFirmwareDistributionSalt: jest.fn(),
  }),
  { virtual: true },
);

jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(() => Promise.resolve({})),
}));

describe("mobile store", () => {
  describe("auth provider flow", () => {
    const MEMBER_CREDENTIALS: MemberCredentials = {
      pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
      privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
    };

    const TRUSTCHAIN_ID = "ROOTID";
    const ATTESTATION = crypto.to_hex(liveAuthentication(TRUSTCHAIN_ID));

    const LKRP_TOKEN = makeJwt({ sub: "idp", exp: 4102444800 });
    const KEYCLOAK_JWT = makeJwt({ sub: "keycloak", exp: 4102444800 });

    const queryFn = jest.fn(() => Promise.resolve());

    const endpoints = {
      keycloakAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpToken: jest.fn<Response, [{ request: Request }]>(),
      tokenExchange: jest.fn<Response, [{ request: Request }]>(),
    };
    const server = setupServer(
      // Any host and realm: which Keycloak the config resolves to is covered by the setup tests.
      http.get("*/realms/:realm/protocol/openid-connect/auth", endpoints.keycloakAuth),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/authenticate`, endpoints.lkrpAuth),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/token`, endpoints.lkrpToken),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/exchange`, endpoints.tokenExchange),
    );

    beforeAll(() => {
      server.listen({ onUnhandledRequest: "error" });
    });

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    it("should execute without a token when ledger auth is disabled by default", async () => {
      const { store } = require("./configureStore");

      await getAuthProvider(store.dispatch).withToken({ queryFn });

      expect(queryFn).toHaveBeenCalledWith();
      expect(endpoints.keycloakAuth).not.toHaveBeenCalled();
    });

    it("should authenticate with attestation when trustchain store has a root id", async () => {
      endpoints.keycloakAuth.mockImplementation(() =>
        HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json }),
      );
      endpoints.lkrpAuth.mockImplementation(() => HttpResponse.json("auth-code-xyz"));
      endpoints.lkrpToken.mockImplementation(() =>
        HttpResponse.json({ access_token: LKRP_TOKEN, token_type: "Bearer" }),
      );
      endpoints.tokenExchange.mockImplementation(() =>
        HttpResponse.json({ access_token: KEYCLOAK_JWT, token_type: "Bearer" }),
      );

      const { store } = require("./configureStore");
      store.dispatch(setOverride({ key: "lwmAuth", value: { enabled: true } }));
      store.dispatch(
        importTrustchainStoreState({
          trustchain: {
            rootId: TRUSTCHAIN_ID,
            walletSyncEncryptionKey: "wallet-sync-encryption-key",
            applicationPath: "m/0'/16'/0'",
          },
          memberCredentials: MEMBER_CREDENTIALS,
        }),
      );

      await getAuthProvider(store.dispatch).withToken({
        queryFn,
        refreshAndRetryWhen: () => true,
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" }),
      );

      const challengeRequest = await endpoints.lkrpAuth.mock.calls.at(-1)?.[0].request.json();
      expect(challengeRequest).toEqual(
        expect.objectContaining({
          signature: expect.objectContaining({
            credential: expect.objectContaining({
              publicKey: MEMBER_CREDENTIALS.pubkey,
            }),
            attestation: ATTESTATION,
          }),
        }),
      );
    });
  });

  describe("startup wiring", () => {
    beforeEach(() => {
      jest.resetModules();
      const { setEnv } = require("@shared/env") as typeof import("@shared/env");
      setEnv("LEDGER_CLIENT_VERSION", "jest");
    });

    it("registers the rate lookups when the store module loads", () => {
      const { store } = require("./configureStore");
      const { setupRateLookups } = require("~/config/bridge-setup");

      expect(store).toBeDefined();
      expect(setupRateLookups).toHaveBeenCalledTimes(1);
    });
  });

  describe("thunk extraArgument", () => {
    const ACCOUNT_DATA = { router: {}, inflight: new Map() };

    beforeEach(() => {
      jest.resetModules();
      jest.doMock("@domain/api-account-data", () => ({
        ...jest.requireActual("@domain/api-account-data"),
        accountDataExtra: () => ({ accountData: ACCOUNT_DATA }),
      }));
      const { setEnv } = require("@shared/env") as typeof import("@shared/env");
      setEnv("LEDGER_CLIENT_VERSION", "jest");
    });

    afterEach(() => {
      jest.dontMock("@domain/api-account-data");
    });

    it("equals the per-service spread it replaces, for env values without whitespace", () => {
      const { store } = require("./configureStore") as typeof import("./configureStore");
      const { getEnv } = require("@shared/env") as typeof import("@shared/env");
      const services = require("@shared/api-services") as typeof import("@shared/api-services");
      const card = require("@features/platform-card") as typeof import("@features/platform-card");
      const Config = require("react-native-config").default;

      const previousSpread = {
        accountData: ACCOUNT_DATA,
        ...services.calApiExtra({
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
        ...services.cvsApiExtra({
          getCountervaluesServiceUrl: () => getEnv("LEDGER_COUNTERVALUES_API"),
        }),
        ...services.coinMarketCapApiExtra({
          coinMarketCapApiUrl: getEnv("CMC_API_URL"),
        }),
        ...services.cardApiExtra({
          getCardApiBaseUrl: () => getEnv("CARD_BAANX_API_URL"),
          getCardBaanxClientKey: () => getEnv("CARD_BAANX_CLIENT_KEY"),
          isCardUsEnv: () => card.isCardUsEnv(getEnv("CARD_BAANX_US_APP_ID")),
          readCardSession: card.readCardSession,
          isCardSessionCurrent: card.isCardSessionCurrent,
          refreshCardSession: card.refreshCardSession,
        }),
        ...services.pushDevicesApiExtra({
          pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
        ...services.swapApiExtra({
          getSwapApiBaseUrl: () => Config.SWAP_API_BASE || "https://swap.ledger.com/v5",
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      };

      expect(resolveGetters(readExtra(store))).toStrictEqual(resolveGetters(previousSpread));
    });

    it("resolves the swap base url through Config, not @shared/env", () => {
      const { store } = require("./configureStore") as typeof import("./configureStore");
      const { setEnv } = require("@shared/env") as typeof import("@shared/env");
      const Config = require("react-native-config").default;
      const { getSwapApiBaseUrl } = resolveSwapExtra(readExtra(store));

      expect(getSwapApiBaseUrl()).toBe("https://swap.ledger.com/v5");

      setEnv("SWAP_API_BASE", "https://swap.env.example/v5");
      expect(getSwapApiBaseUrl()).toBe("https://swap.ledger.com/v5");

      Config.SWAP_API_BASE = "https://swap.config.example/v5";
      try {
        expect(getSwapApiBaseUrl()).toBe("https://swap.config.example/v5");
      } finally {
        delete Config.SWAP_API_BASE;
      }
    });

    it("reads the client version when the store is created", () => {
      const { setEnv } = require("@shared/env") as typeof import("@shared/env");
      setEnv("LEDGER_CLIENT_VERSION", "set-before-store-creation");
      const { store } = require("./configureStore") as typeof import("./configureStore");

      expect(readExtra(store)).toEqual(
        expect.objectContaining({ ledgerClientVersion: "set-before-store-creation" }),
      );
    });
  });

  describe("env reads at store creation", () => {
    let recording = false;
    const reads: string[] = [];

    beforeEach(() => {
      jest.resetModules();
      reads.length = 0;
      jest.doMock("@shared/env", () => {
        const actual = jest.requireActual<typeof import("@shared/env")>("@shared/env");
        return {
          ...actual,
          getEnv: (name: Parameters<typeof actual.getEnv>[0]) => {
            if (recording) reads.push(name);
            return actual.getEnv(name);
          },
        };
      });
      jest.doMock("@reduxjs/toolkit", () => {
        const actual = jest.requireActual<typeof import("@reduxjs/toolkit")>("@reduxjs/toolkit");
        return {
          ...actual,
          configureStore: (options: Parameters<typeof actual.configureStore>[0]) => {
            recording = options.reducer === require("~/reducers").default;
            try {
              return actual.configureStore(options);
            } finally {
              recording = false;
            }
          },
        };
      });
      const { setEnv } = require("@shared/env") as typeof import("@shared/env");
      setEnv("LEDGER_CLIENT_VERSION", "jest");
    });

    afterEach(() => {
      jest.dontMock("@shared/env");
      jest.dontMock("@reduxjs/toolkit");
    });

    it("reads each env var as the per-service spread did, and the client version once", () => {
      const { store } = require("./configureStore") as typeof import("./configureStore");

      expect(store).toBeDefined();
      expect(countBy(reads)).toEqual(ENV_READS_AT_STORE_CREATION);
    });
  });
});

/** The per-service spread read `LEDGER_CLIENT_VERSION` three times; `CommonConfig` reads it once. */
const ENV_READS_AT_STORE_CREATION = {
  CAL_SERVICE_URL: 1,
  CMC_API_URL: 1,
  FEATURE_FLAGS: 1,
  LEDGER_CLIENT_VERSION: 1,
  LEDGER_COUNTERVALUES_API: 1,
  PUSH_DEVICES_SERVICE_URL: 2,
  SYNC_MAX_CONCURRENT: 1,
};

function countBy(names: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const name of names) counts[name] = (counts[name] ?? 0) + 1;
  return counts;
}

const GETTER_KEYS = new Set([
  "getCardApiBaseUrl",
  "getCardBaanxClientKey",
  "getCountervaluesServiceUrl",
  "getSwapApiBaseUrl",
  "isCardUsEnv",
]);

// The store's `dispatch` type drops the thunk overload, though the thunk middleware runs.
function isThunkDispatch(
  dispatch: unknown,
): dispatch is ThunkDispatch<unknown, unknown, UnknownAction> {
  return typeof dispatch === "function";
}

function readExtra({ dispatch }: { dispatch: unknown }): unknown {
  if (!isThunkDispatch(dispatch)) throw new Error("store.dispatch is not a function");
  let extra: unknown;
  dispatch((_dispatch, _getState, extraArgument) => {
    extra = extraArgument;
  });
  return extra;
}

/** Inline getters differ by identity on each side, so they are compared by what they return. */
function resolveGetters(extra: unknown): unknown {
  if (typeof extra !== "object" || extra === null) return extra;
  return Object.fromEntries(
    Object.entries(extra).map(([key, value]) => [
      key,
      GETTER_KEYS.has(key) && typeof value === "function" ? value() : value,
    ]),
  );
}

function resolveSwapExtra(extra: unknown): { getSwapApiBaseUrl: () => unknown } {
  if (
    typeof extra !== "object" ||
    extra === null ||
    !("getSwapApiBaseUrl" in extra) ||
    typeof extra.getSwapApiBaseUrl !== "function"
  ) {
    throw new Error("extraArgument has no getSwapApiBaseUrl");
  }
  const { getSwapApiBaseUrl } = extra;
  return { getSwapApiBaseUrl: () => getSwapApiBaseUrl() };
}

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
