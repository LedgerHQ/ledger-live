import { openAuthSessionAsync } from "expo-web-browser";
import type { HostedLoginResult } from "../../state/types";

/**
 * The second argument is the app's deep link, not the OAuth redirect URI. The session ends on it, so
 * it has to carry a custom scheme: `ASWebAuthenticationSession` takes its scheme as the
 * `callbackURLScheme`, and the Android polyfill matches the incoming link against the whole value.
 * The provider redirects to this link, which is what brings the two together.
 *
 * The session's own answer carries the redirect, so it is the fastest of the two callback routes. The
 * app's deep link is the other one, and whichever arrives first wins.
 */
export async function openHostedLoginInSecureBrowser(
  loginUrl: string,
  deepLink: string,
): Promise<HostedLoginResult> {
  const result = await openAuthSessionAsync(loginUrl, deepLink);

  return result.type === "success" ? { type: "success", url: result.url } : { type: "dismissed" };
}
