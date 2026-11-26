import { AuthSDK } from "@ledgerhq/auth";
import {
  createKeyRingIdentityProvider,
  selectKeyRingSession,
} from "@features/platform-key-ring/store";
import { createAuthMiddleware } from "@shared/auth";
import { selectFeature } from "@shared/feature-flags";
import type { State } from "~/renderer/reducers";
import type { loadAppConfig } from "~/setup";

type KeycloakConfig = Pick<
  ReturnType<typeof loadAppConfig>["config"],
  "keycloakClientId" | "keycloakBaseUrl" | "keycloakRealm"
>;

export function createDesktopAuthMiddleware({
  keycloakClientId,
  keycloakBaseUrl,
  keycloakRealm,
}: KeycloakConfig) {
  return createAuthMiddleware<State>({
    isFeatureEnabled: (state): boolean => selectFeature(state, "lwdAuth").enabled ?? false,
    createAuthProvider: getState =>
      new AuthSDK(
        { clientId: keycloakClientId, keycloakBaseUrl, keycloakRealm, disablePkce: true },
        { provider: createKeyRingIdentityProvider(() => selectKeyRingSession(getState())) },
      ),
  });
}
