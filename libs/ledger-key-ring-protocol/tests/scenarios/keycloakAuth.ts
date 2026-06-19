import makeFetchCookie from "fetch-cookie";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "../../src/LKRPIdentityProvider";
import { ScenarioOptions } from "../test-helpers/types";

/**
 * Exercises the Keycloak authentication flow through the LKRP identity provider.
 *
 * The member credentials and trustchain are created in-scenario so the run is
 * self-contained and deterministic (device randomness is recorded/replayed).
 * PKCE is disabled because its codeVerifier comes from `crypto.getRandomValues`,
 * which the recorder does not capture and would break strict replay matching.
 */
const KEYCLOAK_BASE_URL = "https://keycloak.api.live.aws.stg.ldg-tech.com";
const KEYCLOAK_REALM = "ledger-bc-customers";
const CLIENT_ID = "ledger-keycloak";

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const sdk = sdkForName("cli-member1");
  const credentials = await sdk.initMemberCredentials();
  const { trustchain } = await sdk.getOrCreateTrustchain(deviceId, credentials);

  const provider = new LkrpIdentityProvider();
  provider.setKeypair(credentials);
  provider.setTrustchainId(trustchain.rootId);

  const token = await new AuthSDK(
    {
      clientId: CLIENT_ID,
      keycloakBaseUrl: KEYCLOAK_BASE_URL,
      keycloakRealm: KEYCLOAK_REALM,
      disablePkce: true,
    },
    { provider, fetch: makeFetchCookie(fetch) },
  ).authenticate();

  expect(token.accessToken).toBeTruthy();
}

export const recorderConfig = {};
