import { z } from "zod";

export type AuthConfig = {
  clientId: string;
  keycloakBaseUrl: string;
  keycloakRealm: string;
  disablePkce?: boolean;
};

export type KeycloakToken = {
  scope?: string;
  tokenType: string;
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
};

export const KeycloakTokenResponseSchema = z.object({
  scope: z.string().optional(),
  token_type: z.literal("Bearer"),
  access_token: z.jwt(),
  expires_in: z.number().optional(),
  refresh_token: z.jwt().optional(),
  refresh_expires_in: z.number().optional(),
});
export type KeycloakTokenResponse = z.infer<typeof KeycloakTokenResponseSchema>;

export type TokenState =
  | "valid" // usable as-is
  | "stale" // still usable, but should be refreshed proactively
  | "expired" // must be refreshed or re-issued before use
  | "invalid"; // malformed or missing an exp claim

/**
 * Identity provider related types
 */
export interface IdentityProvider {
  brokerId: string;
  authenticate(request: IdPAuthParams): Promise<KeycloakToken>;
}

export type IdPAuthParams = {
  challenge: unknown;
  clientId: string;
  redirectUri: string;
  codeVerifier?: string;
};

/**
 * Keycloak Service
 */
export interface KeycloakService {
  baseUrl: string;
  realmBaseUrl: string;
  getChallenge(request: ChallengeRequest): Promise<unknown>;
}

export type ChallengeRequest = {
  responseType: "code";
  clientId: string;
  scope: "openid";
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256";
};
