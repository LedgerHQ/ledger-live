import type {
  PayCardAuthorizationCodeRequest,
  PayCardSession,
  PayCardUser,
} from "@domain/api-card-management";
import type { PayCardLoginErrorKind } from "./errors";
import type {
  CardLoginOauthConfig,
  OpenHostedLogin,
  PayCardAuthCallback,
  PayCardAuthStatus,
} from "./hostTypes";

/* --- The login attempt ----------------------------------------------------------------------- */

/**
 * One login attempt: the PKCE verifier the token exchange must present, the challenge derived from
 * that verifier for the authorize URL, and a local id this session uses to recognize its own
 * redirect.
 */
export type PayCardAuthorizeAttempt = Readonly<{
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}>;

/**
 * What survives the hosted login. The challenge is spent on the authorize URL, so only the verifier
 * is kept, and the token exchange presents it.
 */
export type PayCardStoredAttempt = Readonly<{
  codeVerifier: string;
}>;

/* --- What the machine needs from the outside world ------------------------------------------- */

/**
 * Everything the login machine needs from the outside world. The machine itself holds no React, no
 * redux, no platform API — the ViewModel binds these to RTK Query, to the PKCE store and to the
 * platform-card session store.
 */
export type CardLoginPorts = Readonly<{
  /** Mints a fresh PKCE pair and a local attempt id. */
  createAttempt: () => Promise<PayCardAuthorizeAttempt>;
  saveAttempt: (attempt: PayCardStoredAttempt) => Promise<void>;
  loadAttempt: () => Promise<PayCardStoredAttempt | null>;
  clearAttempt: () => Promise<void>;
  /** True when a Card session is already on disk. */
  hasSession: () => Promise<boolean>;
  persistSession: (session: PayCardSession) => Promise<void>;
  clearSession: () => Promise<void>;
  /** Removes the cached Card user, so no other screen shows whoever just left. */
  forgetUser: () => void;
  exchangeAuthorizationCode: (request: PayCardAuthorizationCodeRequest) => Promise<PayCardSession>;
  /** Fills the RTK Query cache, so every other screen sees the user too. */
  getUser: () => Promise<PayCardUser>;
  /**
   * Publishes "the card holder is signed in" for the components the machine does not render.
   * `More` reads that flag to decide whether it belongs on screen.
   */
  setSignedIn: (isSignedIn: boolean) => void;
  /** Records that the card holder has logged in once, so the intro is never sold to them again. */
  markIntroSeen: () => void;
  /**
   * Records the provider app the redirect named, so the Card API can route every later request. It
   * is kept beside the session, whose lifetime it shares, and the comparison with the US app id
   * belongs to the API layer, which reads the env on every request.
   */
  setProviderAppId: (appId: string | null) => void;
  openHostedLogin: OpenHostedLogin;
}>;

/**
 * What the logout needs from the outside world. It is a separate list, because `More` is a
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
  loginUrl: string | null;
  /**
   * The current attempt's local id, so a redirect from an attempt already abandoned is told apart
   * from the one this session is waiting on. Not a CSRF value: PKCE already ties the code to the
   * verifier on disk.
   */
  attemptState: string | null;
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
  | { type: "DISMISS" }
  | { type: "SESSION_ENDED" }
  | { type: "CALLBACK_RECEIVED"; code: string; state?: string; appId?: string };

/* --- Redux ----------------------------------------------------------------------------------- */

export type PayCardLoginType = "signin" | "signup";

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
  pendingLoginType: PayCardLoginType | null;
  /**
   * Where the Card session stands. The login machine owns the value, and every component outside it
   * reads this instead, because two machines would each hydrate and neither would agree.
   */
  status: PayCardAuthStatus;
  isSessionResolving: boolean;
}>;

export type PayCardLoginIntroState = Readonly<{
  hasSeenLoginIntro: boolean;
}>;
