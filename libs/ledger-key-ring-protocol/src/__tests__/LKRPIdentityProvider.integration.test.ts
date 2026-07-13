import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { Challenge as ChallengeJson, WeakChallengeSignature } from "../api";
import { LkrpIdentityProvider } from "../LKRPIdentityProvider";
import type { MemberCredentials } from "../types";
import { credentialForPubKey, liveAuthentication } from "../utils";
import { CHALLENGE } from "../__mocks__/challenge";

type SignedChallengeRequest = {
  challenge: ChallengeJson;
  signature: WeakChallengeSignature;
};

const CLIENT_ID = "ledger-keycloak";
const KEYCLOAK_BASE_URL = "http://keycloak.test";
const REALM = "ledger-bc-customers";
const REDIRECT_URI = `${KEYCLOAK_BASE_URL}/realms/${REALM}/broker/lkrp/endpoint`;
const KEYCLOAK_OPENID_URL = `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect`;
const TRUSTCHAIN_ID = "ROOTID";
const AUTHORIZATION_CODE = "auth-code-xyz";
const LKRP_TOKEN = makeJwt({ sub: "idp", exp: 4102444800 });
const KEYCLOAK_JWT = makeJwt({ sub: "keycloak", exp: 4102444800 });
const REFRESH_TOKEN = makeJwt({ sub: "refresh", exp: 4102444800 });
const EXPECTED_ATTESTATION = crypto.to_hex(liveAuthentication(TRUSTCHAIN_ID));

const MEMBER_CREDENTIALS: MemberCredentials = {
  pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
  privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
};

describe("LkrpIdentityProvider (integration, MSW)", () => {
  const queryFn = jest.fn().mockResolvedValue({ ok: true });

  const endpoints = {
    keycloakAuth: jest.fn<Response, [{ request: Request }]>(),
    lkrpAuth: jest.fn<Response, [{ request: Request }]>(),
    lkrpToken: jest.fn<Response, [{ request: Request }]>(),
    tokenExchange: jest.fn<Response, [{ request: Request }]>(),
  };
  const server = setupServer(
    http.get(`${KEYCLOAK_OPENID_URL}/auth`, endpoints.keycloakAuth),
    http.post(`https://${CHALLENGE.json.host}/openid/v1/authenticate`, endpoints.lkrpAuth),
    http.post(`https://${CHALLENGE.json.host}/openid/v1/token`, endpoints.lkrpToken),
    http.post(`https://${CHALLENGE.json.host}/openid/v1/exchange`, endpoints.tokenExchange),
  );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("retrieves a Keycloak JWT with PKCE", async () => {
    endpoints.keycloakAuth.mockReturnValue(
      HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json }),
    );
    endpoints.lkrpAuth.mockReturnValue(HttpResponse.json("auth-code-xyz"));
    endpoints.lkrpToken.mockReturnValue(
      HttpResponse.json({ access_token: LKRP_TOKEN, token_type: "Bearer" }),
    );
    endpoints.tokenExchange.mockReturnValue(
      HttpResponse.json({
        access_token: KEYCLOAK_JWT,
        token_type: "Bearer",
        scope: "openid",
        expires_in: 300,
        refresh_token: REFRESH_TOKEN,
        refresh_expires_in: 1800,
      }),
    );

    await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: false,
      },
      { provider: createIdentityProvider(TRUSTCHAIN_ID) },
    ).withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledWith({
      accessToken: KEYCLOAK_JWT,
      tokenType: "Bearer",
      scope: "openid",
      expiresIn: 300,
      refreshToken: REFRESH_TOKEN,
      refreshExpiresIn: 1800,
    });

    const keycloakRequest = endpoints.keycloakAuth.mock.calls[0][0].request;
    const pkceChallenge = new URL(keycloakRequest.url).searchParams.get("code_challenge");

    // Check /authenticate
    const challengeRequestBody = await endpoints.lkrpAuth.mock.calls[0][0].request.json();
    expect(challengeRequestBody).toEqual(
      expect.objectContaining({
        challenge: CHALLENGE.json,
        signature: expect.objectContaining({
          credential: credentialForPubKey(MEMBER_CREDENTIALS.pubkey),
          attestation: EXPECTED_ATTESTATION,
          signature: expect.any(String),
        }),
      }),
    );
    const signature = (challengeRequestBody as SignedChallengeRequest).signature;
    expect(
      crypto.verify(
        crypto.hash(CHALLENGE.parsed.getUnsignedTLV()),
        crypto.from_hex(signature.signature),
        crypto.from_hex(MEMBER_CREDENTIALS.pubkey),
      ),
    ).toBe(true);

    // Check /token
    const tokenRequest = endpoints.lkrpToken.mock.calls[0][0].request;
    expect(tokenRequest.headers.get("Content-Type")).toContain("application/x-www-form-urlencoded");
    const tokenRequestBody = new URLSearchParams(await tokenRequest.text());
    expect(Object.fromEntries(tokenRequestBody)).toEqual({
      grant_type: "authorization_code",
      code: AUTHORIZATION_CODE,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: expect.any(String),
    });
    const codeVerifier = tokenRequestBody.get("code_verifier") ?? "";
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      stringToArrayBuffer(codeVerifier),
    );
    expect(bytesToBase64Url(digest)).toBe(pkceChallenge);

    // Check /exchange
    const tokenExchangeRequest = endpoints.tokenExchange.mock.calls[0][0].request;
    expect(tokenExchangeRequest.headers.get("Authorization")).toBe(`Bearer ${LKRP_TOKEN}`);
    expect(await tokenExchangeRequest.json()).toEqual({ client_id: CLIENT_ID });
  });

  it("retrieves a Keycloak JWT without PKCE", async () => {
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

    await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: true,
      },
      { provider: createIdentityProvider(TRUSTCHAIN_ID) },
    ).withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledWith({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" });

    const keycloakRequest = endpoints.keycloakAuth.mock.calls[0][0].request;
    const keycloakSearchParams = new URL(keycloakRequest.url).searchParams;
    expect(keycloakSearchParams.has("code_challenge")).toBe(false);
    expect(keycloakSearchParams.has("code_challenge_method")).toBe(false);

    const tokenRequest = endpoints.lkrpToken.mock.calls[0][0].request;
    const tokenRequestBody = new URLSearchParams(await tokenRequest.text());
    expect(tokenRequestBody.has("code_verifier")).toBe(false);
  });

  it("retrieves a Keycloak JWT without attestation when no trustchain id is set", async () => {
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

    await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: true,
      },
      { provider: createIdentityProvider(undefined) },
    ).withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledWith({ accessToken: KEYCLOAK_JWT, tokenType: "Bearer" });

    const challengeRequestBody = await endpoints.lkrpAuth.mock.calls[0][0].request.json();
    const signature = (challengeRequestBody as SignedChallengeRequest).signature;
    expect(signature).not.toHaveProperty("attestation");
    expect(signature.credential).toEqual(credentialForPubKey(MEMBER_CREDENTIALS.pubkey));
    expect(
      crypto.verify(
        crypto.hash(CHALLENGE.parsed.getUnsignedTLV()),
        crypto.from_hex(signature.signature),
        crypto.from_hex(MEMBER_CREDENTIALS.pubkey),
      ),
    ).toBe(true);
  });
});

function createIdentityProvider(trustchainId: string | undefined): LkrpIdentityProvider {
  const provider = new LkrpIdentityProvider();
  provider.setTrustchainStore({
    memberCredentials: MEMBER_CREDENTIALS,
    trustchain: trustchainId ? { rootId: trustchainId } : null,
  });
  return provider;
}

function stringToArrayBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${objToBase64Url({ alg: "none", typ: "JWT" })}.${objToBase64Url(payload)}.signature`;
}

function objToBase64Url(object: object): string {
  return Buffer.from(JSON.stringify(object)).toString("base64url");
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}
