import { Challenge, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { HttpResponse, http } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import type { Challenge as ChallengeJson, ChallengeSignature } from "../api";
import { LkrpIdentityProvider } from "../LKRPIdentityProvider";
import type { MemberCredentials } from "../types";
import { credentialForPubKey, liveAuthentication } from "../utils";

type SignedChallengeRequest = {
  challenge: ChallengeJson;
  signature: ChallengeSignature;
};

const CLIENT_ID = "ledger-keycloak";
const KEYCLOAK_BASE_URL = "http://keycloak.test";
const REALM = "ledger-bc-customers";
const REDIRECT_URI = `${KEYCLOAK_BASE_URL}/realms/${REALM}/broker/lkrp/endpoint`;
const KEYCLOAK_OPENID_URL = `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect`;
const TRUSTCHAIN_ID = "ROOTID";
const AUTHORIZATION_CODE = "auth-code-xyz";
const IDP_TOKEN = makeJwt({ sub: "idp", exp: 4102444800 });
const EXPECTED_JWT = makeJwt({ sub: "keycloak", exp: 4102444800 });
const REFRESH_TOKEN = makeJwt({ sub: "refresh", exp: 4102444800 });

const MEMBER_CREDENTIALS: MemberCredentials = {
  pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
  privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
};

const CHALLENGE_TLV =
  "010107020100121053801a35c2e24b627d6e4925ce318980140101154630440220319b42a416512437e48d9c9bf204daea7da03d452c50a8caa4c2d152407ffd0c02201f121b0e99df1d30f4757b6a00b8d974d70996771893ac49c4a245c147cc1d8f160466a90248202b7472757374636861696e2d6261636b656e642e6170692e6177732e7374672e6c64672d746563682e636f6d320121332103cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2600401000000";
const [PARSED_CHALLENGE] = Challenge.fromBytes(crypto.from_hex(CHALLENGE_TLV));
const CHALLENGE_JSON = toApiChallenge(PARSED_CHALLENGE);
const IDP_HOST = CHALLENGE_JSON.host;

describe("LkrpIdentityProvider (integration, MSW)", () => {
  let server: SetupServerApi;

  beforeAll(() => {
    server = initServer();
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("retrieves a Keycloak JWT without PKCE", async () => {
    const token = await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: true,
      },
      { provider: createIdentityProvider() },
    ).authenticate();

    expect(token).toEqual({
      accessToken: EXPECTED_JWT,
      tokenType: "Bearer",
      scope: "openid",
      expiresIn: 300,
      refreshToken: REFRESH_TOKEN,
      refreshExpiresIn: 1800,
    });
  });

  it("retrieves a Keycloak JWT with PKCE", async () => {
    const token = await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: false,
      },
      { provider: createIdentityProvider() },
    ).authenticate();

    expect(token).toEqual({
      accessToken: EXPECTED_JWT,
      tokenType: "Bearer",
      scope: "openid",
      expiresIn: 300,
      refreshToken: REFRESH_TOKEN,
      refreshExpiresIn: 1800,
    });
  });
});

function createIdentityProvider(): LkrpIdentityProvider {
  const provider = new LkrpIdentityProvider();
  provider.setKeypair(MEMBER_CREDENTIALS);
  provider.setTrustchainId(TRUSTCHAIN_ID);
  return provider;
}

function initServer(): SetupServerApi {
  const sessionStore = new Map<string, { codeChallenge?: string }>();
  let pendingCodeChallenge: string | undefined;

  return setupServer(
    http.get(`${KEYCLOAK_OPENID_URL}/auth`, ({ request }) => {
      const url = new URL(request.url);
      const codeChallenge = url.searchParams.get("code_challenge") ?? undefined;
      const codeChallengeMethod = url.searchParams.get("code_challenge_method") ?? undefined;

      if (
        url.searchParams.get("response_type") !== "code" ||
        url.searchParams.get("client_id") !== CLIENT_ID ||
        url.searchParams.get("scope") !== "openid" ||
        url.searchParams.get("redirect_uri") !== REDIRECT_URI ||
        (codeChallenge ? codeChallengeMethod !== "S256" : codeChallengeMethod !== undefined)
      ) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      pendingCodeChallenge = codeChallenge;
      return HttpResponse.json({ json: CHALLENGE_JSON, tlv: CHALLENGE_TLV });
    }),

    http.post(`https://${IDP_HOST}/openid/v1/authenticate`, async ({ request }) => {
      const body = (await request.json()) as SignedChallengeRequest;
      if (!isValidSignedChallengeRequest(body)) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      sessionStore.set(AUTHORIZATION_CODE, { codeChallenge: pendingCodeChallenge });
      pendingCodeChallenge = undefined;

      return HttpResponse.json(AUTHORIZATION_CODE);
    }),

    http.post(`https://${IDP_HOST}/openid/v1/token`, async ({ request }) => {
      const contentType = request.headers.get("Content-Type") ?? "";
      if (!contentType.includes("application/x-www-form-urlencoded")) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      const params = new URLSearchParams(await request.text());
      if (params.get("grant_type") !== "authorization_code") {
        return HttpResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
      }
      if (params.get("client_id") !== CLIENT_ID || params.get("redirect_uri") !== REDIRECT_URI) {
        return HttpResponse.json({ error: "invalid_client" }, { status: 400 });
      }

      const code = params.get("code") ?? "";
      const codeVerifier = params.get("code_verifier");
      const authRequest = sessionStore.get(code);
      sessionStore.delete(code);

      if (!code || !authRequest) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      if (authRequest.codeChallenge) {
        if (!codeVerifier) {
          return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
        }
        const digest = await globalThis.crypto.subtle.digest(
          "SHA-256",
          stringToArrayBuffer(codeVerifier),
        );
        if (bytesToBase64Url(digest) !== authRequest.codeChallenge) {
          return HttpResponse.json({ error: "invalid_grant" }, { status: 400 });
        }
      } else if (codeVerifier) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      return HttpResponse.json({
        access_token: IDP_TOKEN,
        permissions: { [TRUSTCHAIN_ID]: { "m/0'/16'/0'": "ffffffff" } },
        token_type: "Bearer",
      });
    }),

    http.post(`https://${IDP_HOST}/openid/v1/exchange`, async ({ request }) => {
      if (request.headers.get("Authorization") !== `Bearer ${IDP_TOKEN}`) {
        return HttpResponse.json({ error: "invalid_token" }, { status: 401 });
      }

      const body = (await request.json()) as { client_id?: string };
      if (body.client_id !== CLIENT_ID) {
        return HttpResponse.json({ error: "invalid_client" }, { status: 400 });
      }

      return HttpResponse.json({
        access_token: EXPECTED_JWT,
        token_type: "Bearer",
        scope: "openid",
        expires_in: 300,
        refresh_token: REFRESH_TOKEN,
        refresh_expires_in: 1800,
      });
    }),
  );
}

function isValidSignedChallengeRequest(body: SignedChallengeRequest): boolean {
  if (JSON.stringify(body.challenge) !== JSON.stringify(CHALLENGE_JSON)) {
    return false;
  }

  if (
    JSON.stringify(body.signature.credential) !==
    JSON.stringify(credentialForPubKey(MEMBER_CREDENTIALS.pubkey))
  ) {
    return false;
  }

  if (body.signature.attestation !== crypto.to_hex(liveAuthentication(TRUSTCHAIN_ID))) {
    return false;
  }

  return crypto.verify(
    crypto.hash(PARSED_CHALLENGE.getUnsignedTLV()),
    crypto.from_hex(body.signature.signature),
    crypto.from_hex(MEMBER_CREDENTIALS.pubkey),
  );
}

function toApiChallenge(challenge: Challenge): ChallengeJson {
  const json = challenge.toJSON();
  return {
    version: json.version,
    challenge: json.challenge,
    host: json.host,
    rp: json.rp,
    protocolVersion: json.protocolVersion,
  };
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
