import { openAuthSessionAsync } from "expo-web-browser";
import type { OpenHostedLoginOutcome } from "./types";

/**
 * The redirect URI has to reach the session itself: `ASWebAuthenticationSession` needs it to know
 * which callback ends the session, and the Android polyfill matches it against the incoming link.
 *
 * Closing the browser resolves the session rather than rejecting it, so the outcome is returned for
 * the caller to end the attempt on.
 */
export async function openHostedLoginInSecureBrowser(
  loginUrl: string,
  redirectUri: string,
): Promise<OpenHostedLoginOutcome> {
  const result = await openAuthSessionAsync(loginUrl, redirectUri);
  return result.type === "success" ? "redirected" : "cancelled";
}
