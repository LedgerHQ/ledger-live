import { openAuthSessionAsync } from "expo-web-browser";
import type { HostedLoginResult } from "../../state/ports";

/**
 * The redirect URI has to reach the session itself: `ASWebAuthenticationSession` needs it to know
 * which callback ends the session, and the Android polyfill matches it against the incoming link.
 *
 * The session's own answer carries the redirect, so it is the fastest of the two callback routes. The
 * app's deep link is the other one, and whichever arrives first wins.
 */
export async function openHostedLoginInSecureBrowser(
  loginUrl: string,
  redirectUri: string,
): Promise<HostedLoginResult> {
  const result = await openAuthSessionAsync(loginUrl, redirectUri);

  return result.type === "success" ? { type: "success", url: result.url } : { type: "dismissed" };
}
