import type {
  PayCardAuthorizationCodeRequest,
  PayCardAuthorizeInitiate,
  PayCardAuthorizeInitiateRequest,
  PayCardSession,
  PayCardUser,
} from "@domain/api-card-management";
import type { PayCardLoginErrorKind } from "./errors";

/* --- The login attempt, and what the provider sends back ------------------------------------- */

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

/* --- What the machine needs from the outside world ------------------------------------------- */

/**
 * What the OS browser reports when it closes. `success` carries the URL the session stopped on, which
 * is the redirect; `dismissed` covers every way the user left without one.
 */
export type HostedLoginResult =
  | Readonly<{ type: "success"; url: string }>
  | Readonly<{ type: "dismissed" }>;

export type OpenHostedLogin = (loginUrl: string, redirectUri: string) => Promise<HostedLoginResult>;

/**
 * Everything the login machine needs from the outside world. The machine itself holds no React, no
 * redux, no platform API — the ViewModel binds these to RTK Query, to the PKCE store and to the
 * platform-card session store.
 */
export type CardLoginPorts = Readonly<{
  /** Mints a fresh CSRF state and PKCE pair. */
  createAttempt: () => Promise<PayCardAuthorizeAttempt>;
  saveAttempt: (attempt: PayCardStoredAttempt) => Promise<void>;
  loadAttempt: () => Promise<PayCardStoredAttempt | null>;
  clearAttempt: () => Promise<void>;
  /** True when a Card session is already on disk. */
  hasSession: () => Promise<boolean>;
  persistSession: (session: PayCardSession) => Promise<void>;
  clearSession: () => Promise<void>;
  initiateAuthorize: (
    request: PayCardAuthorizeInitiateRequest,
  ) => Promise<PayCardAuthorizeInitiate>;
  exchangeAuthorizationCode: (request: PayCardAuthorizationCodeRequest) => Promise<PayCardSession>;
  /** Fills the RTK Query cache, so every other screen sees the user too. */
  getUser: () => Promise<PayCardUser>;
  /**
   * Publishes "the card holder is signed in" for the components the machine does not render.
   * `CardLogout` reads that flag to decide whether it belongs on screen.
   */
  setSignedIn: (isSignedIn: boolean) => void;
  openHostedLogin: OpenHostedLogin;
}>;

/**
 * What the logout needs from the outside world. It is a separate list, because `CardLogout` is a
 * separate component with no machine: it ends one session and says so, and it never logs anybody in.
 */
export type CardLogoutPorts = Readonly<{
  /** Ends the session at the provider before the local session is cleared. */
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  clearAttempt: () => Promise<void>;
  /** Removes the cached Card user, so no other screen shows whoever just left. */
  forgetUser: () => void;
  setSignedIn: (isSignedIn: boolean) => void;
}>;

/* --- The machine's own shapes ---------------------------------------------------------------- */

/** What the ViewModel hands the machine when it starts. */
export type CardLoginMachineInput = Readonly<{
  ports: CardLoginPorts;
  oauthConfig: CardLoginOauthConfig;
  /** A redirect the app already held when the screen mounted, from a cold start on the deep link. */
  callback?: PayCardAuthCallback | null;
}>;

/** The public halves of one attempt: the CSRF state, and the PKCE challenge derived from the verifier. */
export type CardLoginInitiation = Readonly<{
  state: string;
  codeChallenge: string;
}>;

/**
 * The machine's working memory. No secret is kept here as a source of truth: the PKCE verifier lives
 * in the flow's store and the session lives in platform-card. `session` holds the freshly exchanged
 * tokens for the one step between the exchange and the disk write, and is dropped again straight
 * after.
 */
export type CardLoginContext = {
  ports: CardLoginPorts;
  oauthConfig: CardLoginOauthConfig;
  callback: PayCardAuthCallback | null;
  initiation: CardLoginInitiation | null;
  loginUrl: string | null;
  session: PayCardSession | null;
  errorKind: PayCardLoginErrorKind | null;
  /** Set when the session on disk turned out to be dead, so the wipe takes it as well. */
  clearSession: boolean;
  /** Set when the wipe is only hygiene and a valid session is waiting behind it. */
  resumeAuthenticated: boolean;
};

/** Everything the outside world can tell the machine. Actor results drive the rest. */
export type CardLoginEvent =
  | { type: "LOGIN" }
  | { type: "RETRY" }
  /** A session that ended somewhere else, which is `CardLogout` today. */
  | { type: "SESSION_ENDED" }
  | { type: "CALLBACK_RECEIVED"; code: string; state: string };

/* --- Redux ----------------------------------------------------------------------------------- */

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
  /**
   * True while a Card session is live. The login machine owns the value, and every component outside
   * it reads this flag instead, because two machines would each hydrate and neither would agree.
   */
  isSignedIn: boolean;
}>;
