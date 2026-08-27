import { openAuthSessionAsync } from "expo-web-browser";
import type { HostedLoginResult } from "../../state/types";

/**
 * The second argument is the app's deep link, not the OAuth redirect URI. It is what closes this
 * browser: `ASWebAuthenticationSession` takes its scheme as the `callbackURLScheme`, and the Android
 * polyfill matches the incoming link against the whole value. Only a custom scheme ends a session, so
 * the OAuth redirect URI cannot serve here — the provider accepts an `https` value alone. The provider
 * redirects to this link, which is what brings the two together.
 *
 * Give it nothing, or an `https` value, and the login still completes through the app's own deep link,
 * but nothing closes this browser and it stays on top of the app.
 *
 * The session's own answer carries the redirect, so it is the fastest of the two callback routes. The
 * app's deep link is the other one, and whichever arrives first wins.
 */
export async function openHostedLoginInSecureBrowser(
  loginUrl: string,
  deepLink?: string,
): Promise<HostedLoginResult> {
  const result = await openAuthSessionAsync(loginUrl, deepLink);

  return result.type === "success" ? { type: "success", url: result.url } : { type: "dismissed" };
}
