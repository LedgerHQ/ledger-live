import type { CardLoginOauthConfig } from "./types";

const AUTHORIZE_PATH = "/v1/auth/oauth2/authorize";

/**
 * What the session must cover: who the user is, and a refresh token so the session outlives the
 * access token. `platform:full` is the Card platform scope.
 */
const SCOPE = "openid profile email platform:full offline_access";

/**
 * Builds the authorize URL the secure browser opens.
 *
 * There is no call to the backend first. The provider owns the page and the redirect, so every value
 * it needs travels in the query, and the browser goes straight there. `prompt=consent` makes the
 * provider ask every time, which is what a login has to do.
 *
 * Only the challenge leaves the device. The verifier stays in the attempt store until the token
 * exchange, which is what binds that exchange to this attempt.
 */
export function buildAuthorizeUrl(
  oauthConfig: CardLoginOauthConfig,
  codeChallenge: string,
): string {
  const url = new URL(AUTHORIZE_PATH, oauthConfig.apiUrl);

  url.search = new URLSearchParams({
    client_id: oauthConfig.clientId,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: oauthConfig.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  }).toString();

  return url.toString();
}
