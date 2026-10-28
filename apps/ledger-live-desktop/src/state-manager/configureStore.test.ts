import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { getAuthProvider } from "@shared/auth";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { liveAuthentication } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { setOverride } from "@shared/feature-flags";
import {
  calApiExtra,
  cardApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  portfolioApiExtra,
  pushDevicesApiExtra,
  swapApiExtra,
} from "@shared/api-services";
import { getEnv, type EnvName } from "@shared/env";
import {
  isCardSessionCurrent,
  isCardUsEnv,
  readCardSession,
  refreshCardSession,
} from "@features/platform-card";
import { getPortfolioServiceUrl } from "~/config/portfolioService";
import customCreateStore, { type AppDispatch } from "./configureStore";

jest.mock("@shared/env", () => {
  const actual = jest.requireActual<typeof import("@shared/env")>("@shared/env");
  return { ...actual, getEnv: jest.fn(actual.getEnv) };
});

type ServiceEnv = { [K in EnvName]?: ReturnType<typeof getEnv<K>> };

/** The env keys the api services read their config from. */
const SERVICE_ENV = {
  CAL_SERVICE_URL: "https://cal.example.com",
  CARD_BAANX_API_URL: "https://card.example.com",
  CARD_BAANX_CLIENT_KEY: "card-client-key",
  CARD_BAANX_US_APP_ID: "card-us-app-id",
  CMC_API_URL: "https://cmc.example.com",
  LEDGER_CLIENT_VERSION: "lld/0.0.0-test",
  LEDGER_COUNTERVALUES_API: "https://countervalues.example.com",
  PUSH_DEVICES_SERVICE_URL: "https://push-devices.example.com",
  SWAP_API_BASE: "https://swap.example.com",
} satisfies ServiceEnv;

const actualGetEnv = jest.requireActual<typeof import("@shared/env")>("@shared/env").getEnv;
const serviceEnv: ServiceEnv = SERVICE_ENV;

function getServiceEnv<K extends EnvName>(name: K): ReturnType<typeof getEnv<K>> {
  return serviceEnv[name] ?? actualGetEnv(name);
}

/** Re-read on every request, so two stores hold distinct closures: compare what they return. */
const PER_REQUEST_GETTERS = new Set([
  "getCardApiBaseUrl",
  "getCardBaanxClientKey",
  "getCountervaluesServiceUrl",
  "getSwapApiBaseUrl",
  "isCardUsEnv",
]);

function readExtraArgument(store: ReturnType<typeof customCreateStore>): Record<string, unknown> {
  const dispatch: AppDispatch = store.dispatch;
  return dispatch((_dispatch, _getState, extra) => ({ ...Object(extra) }));
}

function withGettersResolved(extra: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(extra).map(([key, value]) => [
      key,
      PER_REQUEST_GETTERS.has(key) && typeof value === "function" ? { returns: value() } : value,
    ]),
  );
}

/** The spread of the per-service builders the store was configured with before `apiServices`. */
function previousServicesExtra(): Record<string, unknown> {
  return {
    ...calApiExtra({
      calServiceUrl: SERVICE_ENV.CAL_SERVICE_URL,
      ledgerClientVersion: SERVICE_ENV.LEDGER_CLIENT_VERSION,
    }),
    ...cvsApiExtra({
      getCountervaluesServiceUrl: () => SERVICE_ENV.LEDGER_COUNTERVALUES_API,
    }),
    ...coinMarketCapApiExtra({
      coinMarketCapApiUrl: SERVICE_ENV.CMC_API_URL,
    }),
    ...cardApiExtra({
      getCardApiBaseUrl: () => SERVICE_ENV.CARD_BAANX_API_URL,
      getCardBaanxClientKey: () => SERVICE_ENV.CARD_BAANX_CLIENT_KEY,
      isCardUsEnv: () => isCardUsEnv(SERVICE_ENV.CARD_BAANX_US_APP_ID),
      readCardSession,
      isCardSessionCurrent,
      refreshCardSession,
    }),
    ...portfolioApiExtra({
      portfolioServiceUrl: getPortfolioServiceUrl(),
    }),
    ...pushDevicesApiExtra({
      pushDevicesServiceUrl: SERVICE_ENV.PUSH_DEVICES_SERVICE_URL,
      ledgerClientVersion: SERVICE_ENV.LEDGER_CLIENT_VERSION,
    }),
    ...swapApiExtra({
      getSwapApiBaseUrl: () => SERVICE_ENV.SWAP_API_BASE,
      ledgerClientVersion: SERVICE_ENV.LEDGER_CLIENT_VERSION,
    }),
  };
}

describe("customCreateStore", () => {
  describe("thunk extraArgument", () => {
    beforeEach(() => {
      jest.mocked(getEnv).mockImplementation(getServiceEnv);
    });

    afterEach(() => {
      jest.mocked(getEnv).mockImplementation(actualGetEnv);
    });

    it("holds what the per-service builders built, beside the account data router", () => {
      const { accountData, ...servicesExtra } = readExtraArgument(
        customCreateStore({ fetchRemoteFlags: null }),
      );

      expect(accountData).toEqual(
        expect.objectContaining({ router: expect.anything(), inflight: expect.any(Map) }),
      );
      expect(withGettersResolved(servicesExtra)).toEqual(
        withGettersResolved(previousServicesExtra()),
      );
    });

    it("reads the service env keys at store creation as before, the client version once for all", () => {
      const getEnvMock = jest.mocked(getEnv);
      getEnvMock.mockClear();

      customCreateStore({ fetchRemoteFlags: null });

      const reads = Object.fromEntries(
        Object.keys(SERVICE_ENV).map(key => [
          key,
          getEnvMock.mock.calls.filter(([name]) => name === key).length,
        ]),
      );
      expect(reads).toEqual({
        CAL_SERVICE_URL: 1,
        CARD_BAANX_API_URL: 0,
        CARD_BAANX_CLIENT_KEY: 0,
        CARD_BAANX_US_APP_ID: 0,
        CMC_API_URL: 1,
        LEDGER_CLIENT_VERSION: 1,
        LEDGER_COUNTERVALUES_API: 1,
        PUSH_DEVICES_SERVICE_URL: 2,
        SWAP_API_BASE: 0,
      });
    });
  });

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
      jest.clearAllMocks();
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    it("should execute without a token when ledger auth is disabled by default", async () => {
      const store = customCreateStore({ fetchRemoteFlags: null });

      await getAuthProvider(store.dispatch).withToken({ queryFn });

      expect(queryFn).toHaveBeenCalledWith();
      expect(endpoints.keycloakAuth).not.toHaveBeenCalled();
    });

    it("should authenticate with attestation when trustchain store has a root id", async () => {
      endpoints.keycloakAuth.mockReturnValue(
        HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json }),
      );
      endpoints.lkrpAuth.mockReturnValue(HttpResponse.json("auth-code-xyz"));
      endpoints.lkrpToken.mockReturnValue(
        HttpResponse.json({ access_token: LKRP_TOKEN, token_type: "Bearer" }),
      );
      endpoints.tokenExchange.mockReturnValue(
        HttpResponse.json({ access_token: KEYCLOAK_JWT, token_type: "Bearer" }),
      );

      const store = customCreateStore({ fetchRemoteFlags: null });
      store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
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

      await getAuthProvider(store.dispatch).withToken({ queryFn });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" }),
      );

      const challengeRequest = await endpoints.lkrpAuth.mock.calls[0][0].request.json();
      expect(challengeRequest).toEqual(
        expect.objectContaining({
          signature: expect.objectContaining({
            credential: expect.objectContaining({ publicKey: MEMBER_CREDENTIALS.pubkey }),
            attestation: ATTESTATION,
          }),
        }),
      );
    });
  });
});

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
