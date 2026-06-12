/* oxlint-disable eslint/no-console */
import makeFetchCookie from "fetch-cookie";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "../src/LKRPIdentityProvider";
import { readMemberCredentials } from "./utils/readMemberCredentials";

/**
 * Real network smoke check (no mocked endpoints).
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
  const provider = new LkrpIdentityProvider();

  const credentials = await readMemberCredentials();
  provider.setKeypair(credentials);
  provider.setTrustchainId(credentials.trustchainId);

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
      provider,
      fetch: makeFetchCookie(fetch),
    },
  ).authenticate();

  console.log("[CHECK] token:", token);
  if (!token.accessToken) {
    throw new Error("Authentication succeeded but returned an empty access token");
  }
  console.log("\nAuth flow OK: received an access token.");
}
