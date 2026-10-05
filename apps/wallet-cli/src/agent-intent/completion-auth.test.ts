import "../live-common-setup";
import { beforeEach, describe, expect, it } from "bun:test";
import {
  AGENT_KEYCLOAK_ENVIRONMENTS,
  createSoftwareAgentIdentity,
  type AgentEnrollmentCompletionV2,
  type AgentKeycloakConfig,
} from "@ledgerhq/agent-intent-sdk";
import type { JWT, MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  authenticateEnrollmentCompletion,
  type CompletionAuthDependencies,
} from "./completion-auth";
import { refuseAgentDevice } from "../key-ring/lkrp-sdk";

const identity = createSoftwareAgentIdentity();
const APP16_ROOT = "app16-root";
const APP16_PATH = "m/0'/16'/0'";

function makeCompletion(
  accountAccess: Partial<AgentEnrollmentCompletionV2["accountAccess"]> = {},
): AgentEnrollmentCompletionV2 {
  return {
    version: 2,
    agentPubkey: identity.publicKey,
    trustchainId: "app18-root",
    accountAccess: {
      mode: "direct-app16-key-reader",
      environment: "staging",
      trustchainId: APP16_ROOT,
      applicationPath: APP16_PATH,
      ...accountAccess,
    },
  };
}

let tokenProviderInputs: Array<Record<string, unknown>>;
let tokenError: Error | undefined;
let ledgerSyncEnvironments: string[];
let restoreCalls: Array<{ trustchain: Trustchain; credentials: MemberCredentials }>;
let restoredOverride: Partial<Trustchain>;
let jwtPermission: string | undefined;
let withAuthCalled: boolean;

function makeDependencies(): CompletionAuthDependencies {
  return {
    createTokenProvider: input => {
      tokenProviderInputs.push(input);
      return {
        withAccessToken: query => (tokenError ? Promise.reject(tokenError) : query("access-token")),
      };
    },
    createLedgerSyncSdk: environment => {
      ledgerSyncEnvironments.push(environment);
      return {
        restoreTrustchain: (trustchain, credentials) => {
          restoreCalls.push({ trustchain, credentials });
          return Promise.resolve({
            ...trustchain,
            walletSyncEncryptionKey: "key",
            ...restoredOverride,
          });
        },
        withAuth: <T>(
          trustchain: Trustchain,
          _credentials: MemberCredentials,
          job: (jwt: JWT) => Promise<T>,
        ) => {
          withAuthCalled = true;
          const permissions =
            jwtPermission === undefined
              ? {}
              : { [trustchain.rootId]: { [trustchain.applicationPath ?? ""]: jwtPermission } };
          return job({ accessToken: "jwt", permissions });
        },
      };
    },
  };
}

function authenticate(
  completion = makeCompletion(),
  overrides: { environment?: "staging" | "production"; keycloak?: AgentKeycloakConfig } = {},
) {
  return authenticateEnrollmentCompletion(
    {
      completion,
      identity,
      environment: overrides.environment ?? "staging",
      keycloak: overrides.keycloak,
    },
    makeDependencies(),
  );
}

describe("authenticateEnrollmentCompletion", () => {
  beforeEach(() => {
    tokenProviderInputs = [];
    tokenError = undefined;
    ledgerSyncEnvironments = [];
    restoreCalls = [];
    restoredOverride = {};
    jwtPermission = "fffffffb";
    withAuthCalled = false;
  });

  it("accepts a completion whose App-18 token and App-16 permission both check out", async () => {
    await authenticate();

    expect(tokenProviderInputs[0]).toMatchObject({
      trustchainId: "app18-root",
      keycloak: AGENT_KEYCLOAK_ENVIRONMENTS.staging,
    });
    expect(ledgerSyncEnvironments).toEqual(["staging"]);
    expect(restoreCalls[0]).toEqual({
      trustchain: { rootId: APP16_ROOT, applicationPath: APP16_PATH, walletSyncEncryptionKey: "" },
      credentials: { pubkey: identity.publicKey, privatekey: identity.exportSecretKey() },
    });
    expect(withAuthCalled).toBe(true);
  });

  it("uses the keycloak override when one is given", async () => {
    const keycloak = { ...AGENT_KEYCLOAK_ENVIRONMENTS.staging, baseUrl: "https://kc.example.com" };

    await authenticate(makeCompletion(), { keycloak });

    expect(tokenProviderInputs[0]).toMatchObject({ keycloak });
  });

  it("rejects an account access environment that differs from the profile's", async () => {
    await expect(authenticate(makeCompletion({ environment: "production" }))).rejects.toThrow(
      "Completion is for the production environment but the profile was enrolled against staging.",
    );
    expect(tokenProviderInputs).toHaveLength(0);
  });

  it("fails without touching App-16 when no App-18 token can be acquired", async () => {
    tokenError = new Error("not a member");

    await expect(authenticate()).rejects.toThrow("not a member");
    expect(restoreCalls).toHaveLength(0);
  });

  it("rejects an application path outside App-16", async () => {
    await expect(authenticate(makeCompletion({ applicationPath: "m/0'/17'/0'" }))).rejects.toThrow(
      "Ledger Sync path is not an App-16 application path.",
    );
    expect(restoreCalls).toHaveLength(0);
  });

  it("rejects a restored trustchain whose root id differs from the access", async () => {
    restoredOverride = { rootId: "other-root" };

    await expect(authenticate()).rejects.toThrow(
      "Restored Ledger Sync identity or application path does not match access.",
    );
    expect(withAuthCalled).toBe(false);
  });

  it("rejects a restored trustchain whose application path differs from the access", async () => {
    restoredOverride = { applicationPath: "m/0'/16'/1'" };

    await expect(authenticate()).rejects.toThrow(
      "Restored Ledger Sync identity or application path does not match access.",
    );
  });

  it.each([
    ["a different permission", "ffffffff"],
    ["a non-hex permission", "owner"],
    ["no permission", undefined],
  ])("rejects a JWT carrying %s for the App-16 path", async (_label, permission) => {
    jwtPermission = permission;

    await expect(authenticate()).rejects.toThrow(
      "Remote Ledger Sync member must have the App-16 controlled-test permission.",
    );
  });
});

describe("refuseAgentDevice", () => {
  it("throws if the software-only Ledger Sync SDK ever asks for a device", () => {
    expect(() =>
      refuseAgentDevice("device-id")(() => {
        throw new Error("job should never run");
      }),
    ).toThrow("Ledger Sync unexpectedly requested a device in software-only agent mode.");
  });
});
