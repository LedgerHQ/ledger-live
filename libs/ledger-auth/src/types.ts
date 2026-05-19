export type AuthParams = {
  config: AuthConfig;
  signer: Signer;
  authService: AuthService;
};

export type Signer = {
  sign: (algorithm: SigningAlgorithm, data: BufferSource) => Promise<JoseSignature>;
};
export type SigningAlgorithm = Parameters<SubtleCrypto["sign"]>[0];

export type JoseSignature = {
  // JWA algorithm identifier. See: https://jose.authlib.org/en/rfc/7518/
  alg: "ES256";
  // Public key in JWK format. See: https://jose.authlib.org/en/rfc/7517/
  jwk: Pick<JsonWebKey, "kty" | "crv" | "x" | "y"> & { kid?: string };
  signature: ArrayBuffer;
};

export type AuthConfig = {
  clientId: string;
};

/**
 * AuthService related types
 *
 */
export type AuthService = {
  getChallenge: (request: ChallengeRequest) => Promise<ChallengeResponse>;
  authorize: (request: AuthorizeRequest) => Promise<AuthorizeResponse>;
  getToken: (request: TokenRequest) => Promise<TokenResponse>;
};

export type ChallengeRequest = {
  clientId: string;
  audience: string;
  scope: readonly string[];
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
};

export type ChallengeResponse = {
  challenge: string;
  challengeId?: string;
  expiresAt?: string;
};

export type AuthorizeRequest = ChallengeRequest & {
  challenge: string;
  challengeId?: string;
  signature: string;
};

export type AuthorizeResponse = {
  authorizationCode: string;
};

export type TokenRequest = {
  clientId: string;
  authorizationCode: string;
  codeVerifier: string;
};

export type TokenResponse = {
  jwt: string;
};
