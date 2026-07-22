import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { AuthSDK } from "@ledgerhq/ledger-auth";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { liveAuthentication } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { setOverride } from "@shared/feature-flags";

let expoCrypto: typeof import("expo-crypto");

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock("@rozenite/redux-devtools-plugin", () => ({
  rozeniteDevToolsEnhancer: jest.fn(() => (next: (...args: unknown[]) => unknown) => {
    return (...args: unknown[]) => next(...args);
  }),
}));

jest.mock("~/config/bridge-setup", () => ({
  setupCryptoAssetsStore: jest.fn(),
}));

jest.mock("LLM/storage/recentAddresses", () => ({
  setupRecentAddressesStore: jest.fn(),
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
  }),
  { virtual: true },
);

jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(() => Promise.resolve({})),
}));

describe("mobile store", () => {
  describe("AuthSDK flow", () => {
    const AUTH_CONFIG = {
      clientId: "ledger-keycloak",
      keycloakBaseUrl: "http://keycloak.test",
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
    const PKCE_CODE_VERIFIER = "A".repeat(43);
    const PKCE_CODE_CHALLENGE = "Y29kZS1jaGFsbGVuZ2U";

    const queryFn = jest.fn(() => Promise.resolve());

    const endpoints = {
      keycloakAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpAuth: jest.fn<Response, [{ request: Request }]>(),
      lkrpToken: jest.fn<Response, [{ request: Request }]>(),
      tokenExchange: jest.fn<Response, [{ request: Request }]>(),
    };
    const server = setupServer(
      http.get(
        `${AUTH_CONFIG.keycloakBaseUrl}/realms/${AUTH_CONFIG.keycloakRealm}/protocol/openid-connect/auth`,
        endpoints.keycloakAuth,
      ),
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

      // Use the post-reset instance so configureStore reads these environment values.
      const { setEnv } = require("@ledgerhq/live-env") as typeof import("@ledgerhq/live-env");
      setEnv("LEDGER_CLIENT_VERSION", "jest");
      setEnv("LEDGER_AUTH_CLIENT_ID", AUTH_CONFIG.clientId);
      setEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL", AUTH_CONFIG.keycloakBaseUrl);
      setEnv("LEDGER_AUTH_KEYCLOAK_REALM", AUTH_CONFIG.keycloakRealm);
      // Keep PKCE assertions on the same post-reset mock instance used by configureStore.
      expoCrypto = require("expo-crypto") as typeof import("expo-crypto");
    });

    afterAll(() => {
      server.close();
    });

    it("should keep AuthSDK undefined when ledger auth is disabled by default", async () => {
      const { store } = require("./configureStore");

      await dispatchThunk(store, async (_dispatch, _getState, extra) => {
        expect(extra.authSDK).toBeUndefined();
      });
    });

    it("should clear AuthSDK when ledger auth is disabled at runtime", async () => {
      const { store } = require("./configureStore");
      store.dispatch(setOverride({ key: "lwmAuth", value: { enabled: true } }));

      await dispatchThunk(store, async (_dispatch, _getState, extra) => {
        expect(extra.authSDK).toBeDefined();
      });

      store.dispatch(setOverride({ key: "lwmAuth", value: { enabled: false } }));

      await dispatchThunk(store, async (_dispatch, _getState, extra) => {
        expect(extra.authSDK).toBeUndefined();
      });
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

      await dispatchThunk(store, async (_dispatch, _getState, extra) =>
        extra.authSDK?.withToken({
          queryFn,
          refreshAndRetryWhen: () => true,
        }),
      );

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" }),
      );

      expect(expoCrypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
      expect(expoCrypto.digestStringAsync).toHaveBeenCalledWith(
        expoCrypto.CryptoDigestAlgorithm.SHA256,
        PKCE_CODE_VERIFIER,
        { encoding: expoCrypto.CryptoEncoding.BASE64 },
      );

      const keycloakRequest = endpoints.keycloakAuth.mock.calls[0][0].request;
      expect(new URL(keycloakRequest.url).searchParams.get("code_challenge")).toBe(
        PKCE_CODE_CHALLENGE,
      );
      const tokenRequest = endpoints.lkrpToken.mock.calls[0][0].request;
      const tokenRequestBody = new URLSearchParams(await tokenRequest.text());
      expect(tokenRequestBody.get("code_verifier")).toBe(PKCE_CODE_VERIFIER);

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

    it("should authenticate without attestation when trustchain store only has credentials", async () => {
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
          trustchain: null,
          memberCredentials: MEMBER_CREDENTIALS,
        }),
      );

      await dispatchThunk(store, async (_dispatch, _getState, extra) =>
        extra.authSDK?.withToken({
          queryFn,
          refreshAndRetryWhen: () => true,
        }),
      );

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
  extra: { authSDK?: AuthSDK },
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
