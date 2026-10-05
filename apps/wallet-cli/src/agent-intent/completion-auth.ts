import {
  AGENT_KEYCLOAK_ENVIRONMENTS,
  createAgentTokenProvider,
  type AgentEnrollmentCompletionV2,
  type AgentIntentEnvironment,
  type AgentRecoveryCompletion,
  type AgentKeycloakConfig,
  type SoftwareAgentIdentity,
} from "@ledgerhq/agent-intent-sdk";
import type { JWT, Trustchain, TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createAgentLedgerSyncSdk } from "../key-ring/lkrp-sdk";

// Must match the App-16 permission the frontend grants: OWNER without CAN_ADD_BLOCK.
export const APP_16_CONTROLLED_TEST_PERMISSION = 0xfffffffb;

export const APP_16_PATH_RE = /^m\/0'\/16'\/\d+'$/;

type LedgerSyncSdk = Pick<TrustchainSDK, "restoreTrustchain" | "withAuth">;

export type CompletionAuthDependencies = {
  createTokenProvider?: typeof createAgentTokenProvider;
  createLedgerSyncSdk?: (environment: AgentIntentEnvironment) => LedgerSyncSdk;
};

export type CompletionAuthInput = {
  completion: AgentEnrollmentCompletionV2;
  identity: SoftwareAgentIdentity;
  environment: AgentIntentEnvironment;
  keycloak?: AgentKeycloakConfig;
};

/**
 * Proves the relayed completion is real before anything is persisted: the agent key must be a
 * member of the claimed App-18 Trustchain and hold the expected App-16 permission. Fetches no data.
 */
export async function authenticateEnrollmentCompletion(
  input: CompletionAuthInput,
  dependencies: CompletionAuthDependencies = {},
): Promise<void> {
  const { accountAccess } = input.completion;
  if (accountAccess.environment !== input.environment) {
    throw new Error(
      `Completion is for the ${accountAccess.environment} environment but the profile was ` +
        `enrolled against ${input.environment}.`,
    );
  }
  await authenticateApp18Membership(input, dependencies.createTokenProvider);
  await verifyLedgerSyncAccess(input, dependencies.createLedgerSyncSdk);
}

/**
 * Proves the agent key is back in the recovered App-18 Trustchain. App-16 access is left untouched
 * by recovery, so it is not re-verified here.
 */
export function authenticateRecoveryCompletion(
  input: Omit<CompletionAuthInput, "completion"> & { completion: AgentRecoveryCompletion },
  dependencies: Pick<CompletionAuthDependencies, "createTokenProvider"> = {},
): Promise<void> {
  return authenticateApp18Membership(input, dependencies.createTokenProvider);
}

function authenticateApp18Membership(
  {
    completion,
    identity,
    environment,
    keycloak,
  }: Omit<CompletionAuthInput, "completion"> & { completion: { trustchainId: string } },
  createTokenProvider = createAgentTokenProvider,
): Promise<void> {
  return createTokenProvider({
    identity,
    trustchainId: completion.trustchainId,
    keycloak: keycloak ?? AGENT_KEYCLOAK_ENVIRONMENTS[environment],
  }).withAccessToken(() => Promise.resolve());
}

async function verifyLedgerSyncAccess(
  { completion, identity }: CompletionAuthInput,
  createLedgerSyncSdk: (
    environment: AgentIntentEnvironment,
  ) => LedgerSyncSdk = createAgentLedgerSyncSdk,
): Promise<void> {
  const { accountAccess } = completion;
  if (!APP_16_PATH_RE.test(accountAccess.applicationPath)) {
    throw new Error("Ledger Sync path is not an App-16 application path.");
  }
  const sdk = createLedgerSyncSdk(accountAccess.environment);
  const credentials = { pubkey: identity.publicKey, privatekey: identity.exportSecretKey() };
  const restored = await sdk.restoreTrustchain(
    {
      rootId: accountAccess.trustchainId,
      applicationPath: accountAccess.applicationPath,
      walletSyncEncryptionKey: "",
    },
    credentials,
  );
  if (
    restored.rootId !== accountAccess.trustchainId ||
    restored.applicationPath !== accountAccess.applicationPath
  ) {
    throw new Error("Restored Ledger Sync identity or application path does not match access.");
  }
  await sdk.withAuth(restored, credentials, jwt => {
    assertControlledTestPermission(jwt, restored);
    return Promise.resolve();
  });
}

function assertControlledTestPermission(jwt: JWT, trustchain: Trustchain): void {
  const permission = jwt.permissions?.[trustchain.rootId]?.[trustchain.applicationPath];
  if (
    typeof permission !== "string" ||
    !/^[0-9a-f]+$/i.test(permission) ||
    Number.parseInt(permission, 16) !== APP_16_CONTROLLED_TEST_PERMISSION
  ) {
    throw new Error("Remote Ledger Sync member must have the App-16 controlled-test permission.");
  }
}
