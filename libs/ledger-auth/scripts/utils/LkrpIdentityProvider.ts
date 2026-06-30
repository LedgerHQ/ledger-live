import {
  WalletAuthHttpError,
  WalletAuthInvalidAuthorizationError,
  WalletAuthInvalidChallengeError,
  WalletAuthInvalidTokenError,
} from "../../src/errors";
import { postForm, postJson } from "../../src/http";
import {
  KeycloakTokenResponseSchema,
  type IdentityProvider,
  type IdPAuthParams,
  type KeycloakToken,
  type KeycloakTokenResponse,
} from "../../src/types";
import { excludeFromTlv, toTlvField } from "./tlv";
import type { KeyPair } from "./types";

export class LkrpIdentityProvider implements IdentityProvider {
  readonly brokerId = "lkrp";

  constructor(
    private readonly keypair: KeyPair,
    private readonly trustchainId: string,
  ) {}

  async authenticate(request: IdPAuthParams): Promise<KeycloakToken> {
    checkChallenge(request.challenge);
    const host = request.challenge.json.host;
    console.log("[LKRP] IdP host:", host);
    console.log("[LKRP] challenge.json:", request.challenge.json);
    console.log("[LKRP] challenge.tlv:", request.challenge.tlv);
    console.log("[LKRP] redirectUri:", request.redirectUri);

    // Step 1: prove ownership of the key by sending the signed challenge, getting back an authorization code.
    const signature = this.signChallenge(request.challenge);
    console.log("[LKRP] step1 signed challenge:", signature);
    const authorizationCode = await postJson(`https://${host}/openid/v1/authenticate`, {
      challenge: request.challenge.json,
      signature,
    })
      .then(authorizationCode => {
        checkAuthCode(authorizationCode);
        return authorizationCode;
      })
      .catch(e => {
        console.error("[LKRP] step1 (authenticate) failed:", describeError(e));
        throw e;
      });
    console.log("[LKRP] step1 authorization code:", authorizationCode);

    // Step 2: redeem the authorization code (with PKCE verifier when present) for the IdP access token.
    const formBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: request.clientId,
      redirect_uri: request.redirectUri,
    });
    if (request.codeVerifier) {
      formBody.set("code_verifier", request.codeVerifier);
    }
    const idPToken = await postForm(`https://${host}/openid/v1/token`, formBody)
      .then(idPToken => {
        checkAuthToken(idPToken);
        return idPToken;
      })
      .catch(e => {
        console.error("[LKRP] step2 (token) failed:", describeError(e));
        throw e;
      });
    console.log("[LKRP] step2 token response:", idPToken);

    // Step 3: exchange the IdP token for the Keycloak token directly at the IdP, authenticating with the IdP token.
    const exchangeBody: ExchangeRequest = { client_id: request.clientId };
    const exchangeResponse = await postJson(`https://${host}/openid/v1/exchange`, exchangeBody, {
      Authorization: `Bearer ${idPToken.access_token}`,
    })
      .then(checkExchangeToken)
      .catch(e => {
        console.error("[LKRP] step3 (exchange) failed:", describeError(e));
        throw e;
      });
    console.log("[LKRP] step3 exchange response:", exchangeResponse);

    return {
      scope: exchangeResponse.scope,
      tokenType: exchangeResponse.token_type,
      accessToken: exchangeResponse.access_token,
      expiresIn: exchangeResponse.expires_in,
      refreshToken: exchangeResponse.refresh_token,
      refreshExpiresIn: exchangeResponse.refresh_expires_in,
    };
  }

  private signChallenge(challenge: LKRPChallenge): ChallengeSignature {
    // Tags to strip to rebuild the canonical "unsigned challenge" the relying party (rp) signed:
    // 0x14 (rp signAlgorithm), 0x15 (rp signature), 0x32 (rp curveId), 0x33 (rp publicKey).
    // The challenge data (0x12), expiry (0x16), host (0x20) and protocol version (0x60) are kept.
    const unsignedChallengeTLV = excludeFromTlv(
      Buffer.from(challenge.tlv, "hex"),
      [0x14, 0x15, 0x32, 0x33],
    );

    return {
      // curveId 33 = secp256k1, signAlgorithm 1 = ECDSA (matches the challenge's rp credential).
      credential: {
        version: 0,
        curveId: 33,
        signAlgorithm: 1,
        publicKey: this.keypair.publicKey.toString("hex"),
      },

      // Spec https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/4335960138/ARCH+LedgerLive+Auth+specifications
      attestation: toTlvField(0x02, Buffer.from(this.trustchainId, "utf8")).toString("hex"),

      signature: this.keypair.sign(unsignedChallengeTLV).toString("hex"),
    };
  }
}

// --- Helpers ---

function checkChallenge(challenge: unknown): asserts challenge is LKRPChallenge {
  if (typeof challenge !== "object") {
    throw new WalletAuthInvalidChallengeError();
  }
}

function checkAuthCode(code: unknown): asserts code is string {
  if (typeof code !== "string") {
    throw new WalletAuthInvalidAuthorizationError();
  }
}

function checkAuthToken(token: unknown): asserts token is { access_token: string } {
  if (typeof token !== "object") {
    throw new WalletAuthInvalidTokenError();
  }
}

function checkExchangeToken(token: unknown): KeycloakTokenResponse {
  try {
    return KeycloakTokenResponseSchema.parse(token);
  } catch {
    throw new WalletAuthInvalidTokenError();
  }
}

function describeError(e: unknown): string {
  if (e instanceof WalletAuthHttpError) {
    return `WalletAuthHttpError status=${e.status} message=${e.message}`;
  }
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
}

// --- Types ---

type LKRPChallenge = { json: ChallengeJSON; tlv: string };

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

type ChallengeSignature = {
  credential: { version: 0; curveId: 33; signAlgorithm: 1; publicKey: string };
  signature: string;
  attestation: string;
};

type ExchangeRequest = {
  client_id: string;
};
