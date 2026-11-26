import type { IdentityProvider } from "@ledgerhq/auth";
import type { KeyRingSession } from "../types";
import { createV1IdentityProvider } from "../internals/v1/identityProvider";

/**
 * The identity provider of `@ledgerhq/auth`: signs the Keycloak challenge with this instance's
 * member key and attests the key tree it belongs to. Reads the session at each authentication, so
 * build it once with a reader over the store.
 *
 * @example
 * ```ts
 * new AuthSDK(
 *   { clientId: keycloakClientId, keycloakBaseUrl, keycloakRealm, disablePkce: true },
 *   { provider: createKeyRingIdentityProvider(() => selectKeyRingSession(getState())) },
 * );
 * ```
 */
export function createKeyRingIdentityProvider(readSession: () => KeyRingSession): IdentityProvider {
  return createV1IdentityProvider(readSession);
}
