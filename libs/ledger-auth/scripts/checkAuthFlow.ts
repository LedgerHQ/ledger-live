/* oxlint-disable eslint/no-console */
import makeFetchCookie from "fetch-cookie";
import { AuthSDK } from "../src/authSDK";
import { NobleKeyPair } from "./utils/NobleKeyPair";
import { LkrpIdentityProvider } from "./utils/LkrpIdentityProvider";
import { readMemberCredentials } from "./utils/readMemberCredentials";

/**
 * Real network smoke check (no mocked endpoints).
 *
 * Unlike `src/__tests__/authSDK.integration.test.ts` (which mocks every endpoint
 * with MSW), this script runs the full `AuthSDK.authenticate()` flow against a
 * live Keycloak realm and identity provider. It is a manual developer tool, not a
 * test: it is never wired into CI and is run on demand with
 * `pnpm --filter @ledgerhq/ledger-auth check-flow`.
 *
 * Credentials are entered either by piping a MemberCredentials object or writing it interactively.
 * The target environment defaults to the Ledger staging Keycloak and can be overridden with:
 *   - LEDGER_AUTH_KEYCLOAK_BASE_URL
 *   - LEDGER_AUTH_KEYCLOAK_REALM
 *   - LEDGER_AUTH_CLIENT_ID
 */
const KEYCLOAK_BASE_URL =
  process.env.LEDGER_AUTH_KEYCLOAK_BASE_URL ?? "https://keycloak.api.live.aws.stg.ldg-tech.com";
const KEYCLOAK_REALM = process.env.LEDGER_AUTH_KEYCLOAK_REALM ?? "ledger-bc-customers";
const CLIENT_ID = process.env.LEDGER_AUTH_CLIENT_ID ?? "ledger-keycloak";

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("\nAuth flow FAILED:", error);
    process.exit(1);
  });

async function main(): Promise<void> {
  const credentials = await readMemberCredentials();

  console.log("[CHECK] keycloak base url:", KEYCLOAK_BASE_URL);
  console.log("[CHECK] keycloak realm:", KEYCLOAK_REALM);
  console.log("[CHECK] client id:", CLIENT_ID);

  const token = await new AuthSDK(
    {
      clientId: CLIENT_ID,
      keycloakBaseUrl: KEYCLOAK_BASE_URL,
      keycloakRealm: KEYCLOAK_REALM,
    },
    {
      provider: new LkrpIdentityProvider(
        NobleKeyPair.fromMemberCredentials(credentials),
        credentials.trustchainId,
      ),
      fetch: makeFetchCookie(fetch),
    },
  ).authenticate();

  console.log("[CHECK] token:", token);
  if (!token.accessToken) {
    throw new Error("Authentication succeeded but returned an empty access token");
  }
  console.log("\nAuth flow OK: received an access token.");
}
