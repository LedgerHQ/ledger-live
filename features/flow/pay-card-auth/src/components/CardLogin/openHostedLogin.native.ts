import { openAuthSessionAsync } from "expo-web-browser";

/**
 * The redirect URI has to reach the session itself: `ASWebAuthenticationSession` needs it to know
 * which callback ends the session, and the Android polyfill matches it against the incoming link.
 */
export async function openHostedLoginInSecureBrowser(
  loginUrl: string,
  redirectUri: string,
): Promise<void> {
  await openAuthSessionAsync(loginUrl, redirectUri);
}
