import {
  WalletAuthInvalidAuthorizationError,
  WalletAuthInvalidChallengeError,
  WalletAuthInvalidTokenError,
  WalletAuthSignatureError,
} from "../../errors";
import { postForm, postJson } from "../../http";
import { bytesToBase64Url, stringToBytes } from "../../utils";
import type { IdentityProvider, IdPAuthParams, KeycloakToken } from "../../types";

export class CustomIdentityProvider implements IdentityProvider {
  readonly brokerId = "custom";

  constructor(private readonly signer: Signer) {}

  async authenticate(request: IdPAuthParams): Promise<KeycloakToken> {
    this.checkChallenge(request.challenge);

    const host = request.challenge.json.host;
    const challenge = request.challenge.json.challenge.data;
    const signature = await this.signer
      .sign({ name: "ECDSA", hash: "SHA-256" }, stringToBytes(challenge))
      .catch(error => {
        throw new WalletAuthSignatureError(error);
      });

    const signedChallenge: SignedChallengeRequest = {
      challenge,
      algorithm: "ES256",
      jwk: this.signer.jwk,
      signature: bytesToBase64Url(signature),
    };

    // Step 1: prove ownership of the key by sending the signed challenge, getting back an authorization code.
    const authCode = await postJson(`https://${host}/openid/v1/authenticate`, signedChallenge);
    this.checkAuthCode(authCode);

    // Step 2: redeem the authorization code (with PKCE verifier when present) for the IdP access token.
    const formBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      client_id: request.clientId,
      redirect_uri: request.redirectUri,
    });
    if (request.codeVerifier) {
      formBody.set("code_verifier", request.codeVerifier);
    }
    const tokenResponse = await postForm(`https://${host}/openid/v1/token`, formBody);
    this.checkAuthToken(tokenResponse);

    // Step 3: exchange the IdP token for the Keycloak token directly at the IdP, authenticating with the IdP token.
    const exchangeBody: ExchangeRequest = { client_id: request.clientId };
    const exchangeResponse = await postJson(`https://${host}/openid/v1/exchange`, exchangeBody, {
      Authorization: `Bearer ${tokenResponse.access_token}`,
    });
    this.checkExchangeToken(exchangeResponse);

    return {
      scope: exchangeResponse.scope,
      tokenType: exchangeResponse.token_type,
      accessToken: exchangeResponse.access_token,
      expiresIn: exchangeResponse.expires_in,
      refreshToken: exchangeResponse.refresh_token,
      refreshExpiresIn: exchangeResponse.refresh_expires_in,
    };
  }

  private checkChallenge(challenge: unknown): asserts challenge is CustomChallenge {
    if (typeof challenge !== "object") {
      throw new WalletAuthInvalidChallengeError();
    }
  }

  private checkAuthCode(code: unknown): asserts code is string {
    if (typeof code !== "string") {
      throw new WalletAuthInvalidAuthorizationError();
    }
  }

  private checkAuthToken(token: unknown): asserts token is { access_token: string } {
    if (typeof token !== "object") {
      throw new WalletAuthInvalidTokenError();
    }
  }
  private checkExchangeToken(token: unknown): asserts token is AccessTokenResponse {
    if (typeof token !== "object") {
      throw new WalletAuthInvalidTokenError();
    }
  }
}

// --- Types ---

export type CustomChallenge = { json: ChallengeJSON; tlv: string };

type ChallengeJSON = {
  version: number;
  challenge: { data: string; expiry: string };
  host: string;
  rp: Array<{
    credential: { version: number; curveId: number; signAlgorithm: number; publicKey: string };
    signature: string;
  }>;
  protocolVersion: { major: number; minor: number; patch: number };
};

export type Signer = {
  jwk: JoseSignature["jwk"];
  sign: (algorithm: SigningAlgorithm, data: BufferSource) => Promise<ArrayBuffer>;
};

type SigningAlgorithm = Parameters<SubtleCrypto["sign"]>[0];

type SignedChallengeRequest = {
  challenge: string;
  algorithm: JoseSignature["alg"];
  jwk: JoseSignature["jwk"];
  signature: JoseSignature["signature"];
};

type JoseSignature = {
  alg: "ES256";
  jwk: Pick<JsonWebKey, "kty" | "crv" | "x" | "y"> & { kid?: string };
  signature: string;
};

type AccessTokenResponse = {
  scope: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
};

type ExchangeRequest = {
  client_id: string;
};
