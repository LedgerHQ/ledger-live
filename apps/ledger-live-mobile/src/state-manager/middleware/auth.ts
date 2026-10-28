import { AuthSDK } from "@ledgerhq/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { createAuthMiddleware } from "@shared/auth";
import { selectFeature } from "@shared/feature-flags";
import { createPkcePairWithExpoCrypto } from "~/helpers/pkce";
import type { State } from "~/reducers/types";
import type { appConfig } from "~/setup";

type KeycloakConfig = Pick<
  typeof appConfig,
  "keycloakClientId" | "keycloakBaseUrl" | "keycloakRealm"
>;

export function createMobileAuthMiddleware({
  keycloakClientId,
  keycloakBaseUrl,
  keycloakRealm,
}: KeycloakConfig) {
  return createAuthMiddleware<State>({
    isFeatureEnabled: (state): boolean => selectFeature(state, "lwmAuth").enabled ?? false,
    createAuthProvider: getState =>
      new AuthSDK(
        { clientId: keycloakClientId, keycloakBaseUrl, keycloakRealm, disablePkce: true },
        {
          provider: new LkrpIdentityProvider((): TrustchainStore => getState().trustchain),
          createPkcePair: createPkcePairWithExpoCrypto,
        },
      ),
  });
}
