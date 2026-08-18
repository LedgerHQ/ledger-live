/**
 * One login attempt: the `state` the callback must echo back, the PKCE verifier the token exchange
 * must present, and the challenge derived from that verifier for the authorize initiation.
 */
export type PayCardAuthorizeAttempt = Readonly<{
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}>;

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
}>;
