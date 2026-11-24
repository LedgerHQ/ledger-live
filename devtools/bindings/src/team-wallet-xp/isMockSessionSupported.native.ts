/**
 * Mobile keeps the Card session in the Keychain, so a mock one would still be there on the next
 * launch: the app would hydrate as signed in with nothing mocking the provider, and send it a fake
 * bearer token. The mock session is therefore offered on web and desktop only.
 */
export function isMockSessionSupported(): boolean {
  return false;
}
