/**
 * What the provider sends back on the redirect. PKCE binds the code to the verifier on disk, so this
 * is not a CSRF check. `state` only lets the app recognize a redirect from an attempt it has already
 * abandoned, when the source it arrived through can supply it.
 *
 * `appId` names the provider app the holder belongs to. The provider runs one app per region, and
 * this is the only place it says which one, so the flow records it for the Card API to route on.
 */
export type PayCardAuthCallback = Readonly<{
  code: string;
  state?: string;
  appId?: string;
}>;

/**
 * Per-app OAuth client configuration. The values are the app's to know: the API host and the client
 * id come from its environment, and the redirect URI is the one it has whitelisted with the provider.
 */
export type CardLoginOauthConfig = Readonly<{
  /** Base of the Card API, which also hosts the authorize page the browser opens. */
  apiUrl: string;
  clientId: string;
  /**
   * Base of the provider's hosted UI, which carries the signup page the intro opens.
   *
   * Optional, because it can be derived elsewhere (e.g. manifest-driven). Leave it out and
   * `buildSignupUrl` throws.
   */
  hostedUiUrl?: string;
  /**
   * Sent to the provider on authorize. The token exchange does not repeat it. The provider whitelists
   * an `https` URL only, so this one cannot be the app's own link. It redirects to `deepLink`.
   */
  redirectUri: string;
  /**
   * The app's own link, which the redirect above lands on. This is what closes the secure browser:
   * `ASWebAuthenticationSession` takes the scheme of this value as its `callbackURLScheme`, and the
   * Android polyfill matches the incoming link against the whole of it. Only a custom scheme can end a
   * session, so the redirect URI above cannot serve here.
   *
   * Optional, because only a secure browser session has an API that acts on it. Desktop opens the
   * page in a plain webview with no such API to close it, so it passes none. Leave it out on a
   * platform that does have one and the login still completes through the app's deep link, but
   * nothing closes the browser and it stays on top of the app.
   */
  deepLink?: string;
}>;

/**
 * What the hosted login reports back. `success` carries the URL the session stopped on, which is the
 * redirect; `dismissed` covers every way the user left without one; `pending` says the page is open
 * in a context that reports nothing, so the redirect reaches the app by its own deep link instead.
 */
export type HostedLoginResult =
  | Readonly<{ type: "success"; url: string }>
  | Readonly<{ type: "dismissed" }>
  | Readonly<{ type: "pending" }>;

export type OpenHostedLogin = (loginUrl: string, deepLink?: string) => Promise<HostedLoginResult>;

export type OpenCardHostedPage = (path: string) => Promise<void>;

/**
 * Where the Card session stands. `unknown` is the boot value: the login machine is still reading the
 * stored session, so no one can yet say whether the holder is signed in. It lets a host tell "still
 * resolving" from "signed out", which a bare boolean cannot, and so keeps the login CTA from flashing
 * before the machine hydrates.
 */
export type PayCardAuthStatus = "unknown" | "signedOut" | "signedIn";
