import type {
  PayCardAuthorizeInitiate,
  PayCardAuthorizeInitiateRequest,
  PayCardAuthorizeInitiateResponse,
  PayCardSession,
  PayCardSessionResponse,
} from "./types";

/**
 * Carries the redirect URI over from the request: the secure browser has to match the callback
 * against it, and the token exchange has to echo it.
 */
export function transformPayCardAuthorizeInitiateResponse(
  response: PayCardAuthorizeInitiateResponse,
  _meta: unknown,
  { redirectUri }: PayCardAuthorizeInitiateRequest,
): PayCardAuthorizeInitiate {
  return { ...response, redirectUri };
}

/** Maps a validated token response onto the canonical {@link PayCardSession}. */
export function transformPayCardSessionResponse(response: PayCardSessionResponse): PayCardSession {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
    refreshTokenExpiresIn: response.refresh_token_expires_in,
  };
}
