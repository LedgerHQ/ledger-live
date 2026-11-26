import type { IdentityProvider } from "@ledgerhq/auth";
import type { KeyRingRuntime, KeyRingSession } from "../types";
import { runtimePartsOf } from "../internals/runtime";
import { createV1IdentityProvider } from "../internals/v1/identityProvider";

/**
 * The identity provider of `@ledgerhq/auth`: signs the Keycloak challenge with this instance's
 * member key, held by the key store of `runtime`, and attests the key tree it belongs to. Reads
 * the session at each authentication, so build it once with a reader over the store and the
 * runtime of that store's thunk `extraArgument`.
 *
 * @example
 * ```ts
 * new AuthSDK(
 *   { clientId: keycloakClientId, keycloakBaseUrl, keycloakRealm, disablePkce: true },
 *   {
 *     provider: createKeyRingIdentityProvider(keyRingRuntime, () =>
 *       selectKeyRingSession(getState()),
 *     ),
 *   },
 * );
 * ```
 */
export function createKeyRingIdentityProvider(
  runtime: KeyRingRuntime,
  readSession: () => KeyRingSession,
): IdentityProvider {
  return createV1IdentityProvider(runtimePartsOf(runtime).keyStore, readSession);
}
