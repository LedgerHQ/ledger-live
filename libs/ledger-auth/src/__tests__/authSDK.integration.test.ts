import { HttpResponse, http } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import { AuthSDK } from "../authSDK";
import { CustomIdentityProvider } from "./__mocks__/CustomIdentityProvider.mock";
import type { CustomChallenge, Signer } from "./__mocks__/CustomIdentityProvider.mock";
import { bytesToBase64Url, stringToBytes } from "../utils";

type SignedChallengeRequest = {
  challenge: string;
  algorithm: "ES256";
  signature: string;
};

const CLIENT_ID = "ledger-keycloak";
const KEYCLOAK_BASE_URL = "http://keycloak.test";
const IDP_HOST = "idp.test";
const REALM = "ledger-bc-customers";
const REDIRECT_URI = `${KEYCLOAK_BASE_URL}/realms/${REALM}/broker/custom/endpoint`;
const KEYCLOAK_OPENID_URL = `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect`;
const CHALLENGE_DATA = "identity-provider-challenge";
const AUTHORIZATION_CODE = "auth-code-xyz";
const IDP_TOKEN = "idp-access-token";
const EXPECTED_JWT = "integration-jwt-token";

describe("AuthSDK (integration, MSW)", () => {
  let keyPair: CryptoKeyPair;
  let server: SetupServerApi;

  const signer: Signer = {
    jwk: { kty: "EC", crv: "P-256", x: "x", y: "y" },
    sign: async (algorithm, data) => crypto.subtle.sign(algorithm, keyPair.privateKey, data),
  };

  beforeAll(async () => {
    keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
      "sign",
      "verify",
    ]);
    server = initServer(keyPair.publicKey);
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("retrieves a Keycloak JWT without PKCE", async () => {
    const identityProvider = new CustomIdentityProvider(signer);

    const token = await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: true,
      },
      { provider: identityProvider },
    ).authenticate();

    expect(token).toEqual({
      accessToken: EXPECTED_JWT,
      tokenType: "Bearer",
      scope: "openid",
      expiresIn: 300,
      refreshToken: "refresh-token-value",
      refreshExpiresIn: 1800,
    });
  });

  it("retrieves a Keycloak JWT", async () => {
    const identityProvider = new CustomIdentityProvider(signer);

    const token = await new AuthSDK(
      {
        clientId: CLIENT_ID,
        keycloakBaseUrl: KEYCLOAK_BASE_URL,
        keycloakRealm: REALM,
        disablePkce: false,
      },
      { provider: identityProvider },
    ).authenticate();

    expect(token).toEqual({
      accessToken: EXPECTED_JWT,
      tokenType: "Bearer",
      scope: "openid",
      expiresIn: 300,
      refreshToken: "refresh-token-value",
      refreshExpiresIn: 1800,
    });
  });
});

function initServer(publicKey: CryptoKey): SetupServerApi {
  const sessionStore = new Map<string, { codeChallenge?: string }>();
  let pendingCodeChallenge: string | undefined;

  return setupServer(
    http.get(`${KEYCLOAK_OPENID_URL}/auth`, ({ request }) => {
      const url = new URL(request.url);
      const codeChallenge = url.searchParams.get("code_challenge") ?? undefined;

      if (
        url.searchParams.get("response_type") !== "code" ||
        url.searchParams.get("client_id") !== CLIENT_ID ||
        url.searchParams.get("scope") !== "openid" ||
        url.searchParams.get("redirect_uri") !== REDIRECT_URI ||
        (codeChallenge && url.searchParams.get("code_challenge_method") !== "S256")
      ) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      pendingCodeChallenge = codeChallenge;
      const challenge: CustomChallenge = {
        json: {
          version: 1,
          challenge: { data: CHALLENGE_DATA, expiry: "2099-01-01T00:00:00Z" },
          host: IDP_HOST,
          rp: [],
          protocolVersion: { major: 1, minor: 0, patch: 0 },
        },
        tlv: "challenge-tlv",
      };
      return HttpResponse.json(challenge);
    }),

    http.post(`https://${IDP_HOST}/openid/v1/authenticate`, async ({ request }) => {
      const body = (await request.json()) as SignedChallengeRequest;
      if (body.algorithm !== "ES256" || !body.signature || body.challenge !== CHALLENGE_DATA) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      // Verify the signature
      const bytes = Buffer.from(body.signature, "base64url");
      const signatureBytes = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
      const isVerified = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        signatureBytes,
        stringToBytes(body.challenge),
      );
      if (!isVerified) {
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
      const text = await request.text();
      const params = new URLSearchParams(text);
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
        // PKCE flow: a verifier is required and must match the stored challenge.
        if (!codeVerifier) {
          return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
        }
        const digest = await crypto.subtle.digest("SHA-256", stringToBytes(codeVerifier));
        const derived = bytesToBase64Url(digest);
        if (derived !== authRequest.codeChallenge) {
          return HttpResponse.json({ error: "invalid_grant" }, { status: 400 });
        }
      } else if (codeVerifier) {
        // Non-PKCE flow: no verifier should be sent.
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }

      return HttpResponse.json({
        access_token: IDP_TOKEN,
        token_type: "Bearer",
      });
    }),

    http.post(`https://${IDP_HOST}/openid/v1/exchange`, async ({ request }) => {
      const contentType = request.headers.get("Content-Type") ?? "";
      if (!contentType.includes("application/json")) {
        return HttpResponse.json({ error: "invalid_request" }, { status: 400 });
      }
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
        refresh_token: "refresh-token-value",
        refresh_expires_in: 1800,
      });
    }),
  );
}
