import type { PayCardSession, PayCardSessionResponse } from "./types";

/** Maps a validated token response onto the canonical {@link PayCardSession}. */
export function transformPayCardSessionResponse(response: PayCardSessionResponse): PayCardSession {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
    refreshTokenExpiresIn: response.refresh_token_expires_in,
  };
}
