/**
 * One login attempt: the `state` the callback must echo back, the PKCE verifier the token exchange
 * must present, and the challenge derived from that verifier for the authorize initiation.
 */
export type PayCardAuthorizeAttempt = Readonly<{
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}>;

/**
 * What survives the hosted login: the `state` to compare and the verifier to present. The challenge
 * is spent on the initiation, so it is not kept.
 */
export type PayCardStoredAttempt = Readonly<{
  state: string;
  codeVerifier: string;
}>;

/**
 * What the provider sends back on the redirect: the authorization code to exchange, and the `state`
 * that proves the redirect answers our own attempt.
 */
export type PayCardAuthCallback = Readonly<{
  code: string;
  state: string;
}>;

/**
 * Per-app OAuth client configuration. The values are the app's to know: the client id comes from its
 * environment, and the redirect URI is the one it has whitelisted with the provider.
 */
export type CardLoginOauthConfig = Readonly<{
  clientId: string;
  redirectUri: string;
}>;

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
}>;
