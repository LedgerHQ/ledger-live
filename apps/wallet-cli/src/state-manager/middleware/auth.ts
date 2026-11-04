import { AuthSDK } from "@ledgerhq/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { createAuthMiddleware } from "@shared/auth";
import { loadApiAuthIdentity } from "../../key-ring/api-auth-identity";
import { createAuthFetch, excludeFromAuthDeadline } from "../auth-fetch";

export function createWalletCliAuthMiddleware() {
  // Production Keycloak, copied from the deprecated `@shared/env` team-platform definitions. The
  // overrides are for development only and do not change the swap API URL.
  const auth = {
    clientId: process.env.LEDGER_AUTH_CLIENT_ID ?? "ledger-keycloak",
    keycloakBaseUrl:
      process.env.LEDGER_AUTH_KEYCLOAK_BASE_URL ?? "https://global.api.prd.ledger.com/keycloak",
    keycloakRealm: process.env.LEDGER_AUTH_KEYCLOAK_REALM ?? "ledger-bc-customers",
  };
  return createAuthMiddleware({
    // Without a kept API auth key, skip the token fetch: it could only fail.
    isFeatureEnabled: () => loadApiAuthIdentity().memberCredentials !== null,
    createAuthProvider: () =>
      new AuthSDK(
        { ...auth, disablePkce: true },
        {
          provider: new LkrpIdentityProvider(excludeFromAuthDeadline(loadApiAuthIdentity)),
          fetch: createAuthFetch(),
        },
      ),
  });
}
