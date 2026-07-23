import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { setAuthEnvironment, type AuthProvider } from "@shared/auth";
import { setEnv } from "@shared/env";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { liveAuthentication } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { setOverride } from "@shared/feature-flags";
import customCreateStore from "./configureStore";

describe("customCreateStore", () => {
  describe("auth provider flow", () => {
    const PROD_KEYCLOAK_BASE_URL = "http://keycloak-prod.test";
    const STAGING_KEYCLOAK_BASE_URL = "http://keycloak-staging.test";

    const AUTH_CONFIG = {
      clientId: "ledger-keycloak",
      keycloakBaseUrl: PROD_KEYCLOAK_BASE_URL,
      keycloakRealm: "ledger-bc-customers",
    };

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
      prodKeycloakAuth: jest.fn<Response, [{ request: Request }]>(),
      stagingKeycloakAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpToken: jest.fn<Response, [{ request: Request }]>(),
      tokenExchange: jest.fn<Response, [{ request: Request }]>(),
    };
    const server = setupServer(
      http.get(
        `${PROD_KEYCLOAK_BASE_URL}/realms/${AUTH_CONFIG.keycloakRealm}/protocol/openid-connect/auth`,
        endpoints.prodKeycloakAuth,
      ),
      http.get(
        `${STAGING_KEYCLOAK_BASE_URL}/realms/${AUTH_CONFIG.keycloakRealm}/protocol/openid-connect/auth`,
        endpoints.stagingKeycloakAuth,
      ),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/authenticate`, endpoints.lkrpAuth),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/token`, endpoints.lkrpToken),
      http.post(`https://${CHALLENGE.json.host}/openid/v1/exchange`, endpoints.tokenExchange),
    );

    beforeAll(() => {
      setEnv("LEDGER_CLIENT_VERSION", "jest");
      setEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL_PROD", PROD_KEYCLOAK_BASE_URL);
      setEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL_STAGING", STAGING_KEYCLOAK_BASE_URL);
      setEnv("LEDGER_AUTH_CLIENT_ID", AUTH_CONFIG.clientId);
      setEnv("LEDGER_AUTH_KEYCLOAK_REALM", AUTH_CONFIG.keycloakRealm);

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

      await dispatchThunk(store, (_dispatch, _getState, extra) =>
        extra.authProvider.withToken({ queryFn }),
      );

      expect(queryFn).toHaveBeenCalledWith();
      expect(endpoints.prodKeycloakAuth).not.toHaveBeenCalled();
      expect(endpoints.stagingKeycloakAuth).not.toHaveBeenCalled();
    });

    it("should keep a stable auth provider facade when ledger auth is disabled at runtime", async () => {
      const store = customCreateStore({ fetchRemoteFlags: null });
      let injectedAuthProvider: AuthProvider | undefined;

      await dispatchThunk(store, async (_dispatch, _getState, extra) => {
        injectedAuthProvider = extra.authProvider;
      });

      store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
      store.dispatch(setAuthEnvironment("PROD"));

      await dispatchThunk(store, async (_dispatch, _getState, extra) => {
        expect(extra.authProvider).toBe(injectedAuthProvider);
      });

      store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: false } }));

      await dispatchThunk(store, (_dispatch, _getState, extra) =>
        extra.authProvider.withToken({ queryFn }),
      );

      expect(queryFn).toHaveBeenCalledWith();
      expect(endpoints.prodKeycloakAuth).not.toHaveBeenCalled();
    });

    it("should use the staging Keycloak URL for a staging Trustchain SDK", async () => {
      endpoints.stagingKeycloakAuth.mockReturnValue(
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

      store.dispatch(setAuthEnvironment("STAGING"));

      store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
      store.dispatch(
        importTrustchainStoreState({
          trustchain: null,
          memberCredentials: MEMBER_CREDENTIALS,
        }),
      );

      await dispatchThunk(store, async (_dispatch, _getState, extra) =>
        extra.authProvider.withToken({ queryFn }),
      );

      expect(endpoints.stagingKeycloakAuth).toHaveBeenCalledTimes(1);
    });

    it("should authenticate with attestation when trustchain store has a root id", async () => {
      endpoints.prodKeycloakAuth.mockReturnValue(
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
      store.dispatch(setAuthEnvironment("PROD"));
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

      await dispatchThunk(store, async (_dispatch, _getState, extra) =>
        extra.authProvider.withToken({ queryFn }),
      );

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" }),
      );
      expect(endpoints.prodKeycloakAuth.mock.calls[0][0].request.url).toEqual(
        expect.stringContaining(AUTH_CONFIG.keycloakBaseUrl),
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

    it("should authenticate without attestation when trustchain store only has credentials", async () => {
      endpoints.prodKeycloakAuth.mockReturnValue(
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
      store.dispatch(setAuthEnvironment("PROD"));
      store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
      store.dispatch(
        importTrustchainStoreState({
          trustchain: null,
          memberCredentials: MEMBER_CREDENTIALS,
        }),
      );

      await dispatchThunk(store, async (_dispatch, _getState, extra) =>
        extra.authProvider.withToken({ queryFn }),
      );

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" }),
      );

      const challengeRequest = await endpoints.lkrpAuth.mock.calls[0][0].request.json();
      expect(challengeRequest).toEqual(
        expect.objectContaining({
          signature: expect.objectContaining({
            credential: expect.objectContaining({
              publicKey: MEMBER_CREDENTIALS.pubkey,
            }),
          }),
        }),
      );
      expect(challengeRequest.signature).not.toHaveProperty("attestation");
    });
  });
});

type AuthThunk = (
  dispatch: unknown,
  getState: unknown,
  extra: { authProvider: AuthProvider },
) => Promise<unknown>;
type DispatchThunk = (thunk: AuthThunk) => Promise<unknown>;
function dispatchThunk(store: unknown, thunk: AuthThunk): Promise<unknown> {
  const dispatch = (store as { dispatch: unknown }).dispatch as DispatchThunk;
  return dispatch(thunk);
}

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
