/**
 * What a login attempt has to outlive the hosted-UI round trip: the `state` the callback must echo
 * back, and the PKCE verifier the token exchange must present. Both are transient — the slice holding
 * them is never persisted, and they are dropped as soon as the attempt ends, either way.
 */
export type PayCardAuthorizeAttempt = Readonly<{
  state: string;
  codeVerifier: string;
}>;

/** A fresh attempt, before the derived challenge is spent on the authorize initiation. */
export type PayCardAuthorizeAttemptDraft = PayCardAuthorizeAttempt &
  Readonly<{
    codeChallenge: string;
  }>;

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
  authorizeAttempt: PayCardAuthorizeAttempt | null;
}>;
