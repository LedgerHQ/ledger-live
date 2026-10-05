import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";

const AGENT_PUBLIC_KEY = "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076";
const OTHER_PUBLIC_KEY = "02".padEnd(66, "1");
const HOST_PUBLIC_KEY = "03a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
const SECRET_KEY = "5ec2e7".padEnd(64, "0");
const REQUEST_SIGNATURE = "ab".repeat(64);
const ACCOUNT_ACCESS = {
  mode: "direct-app16-key-reader",
  environment: "production",
  trustchainId: "app16-root",
  applicationPath: "m/0'/16'/0'",
};

type Profile = Record<string, unknown>;
type Completion = {
  version: 3;
  recovery: true;
  agentPubkey: string;
  previousTrustchainId: string;
  requestSignature: string;
  trustchainId: string;
};
type WaitInput = {
  request: Record<string, unknown>;
  authenticate: (completion: Completion) => Promise<void>;
  persist: (completion: Completion) => Promise<void>;
};

let storedProfile: Profile | undefined;
let invalidProfileIds: string[];
let sessionReadCalls: number;
let keychainSecretKey: string | null;
let keychainError: Error | undefined;
let keychainPublicKey: string;
let identityInputs: unknown[];
let requestInputs: Array<Record<string, unknown>>;
let recoveryUrlInputs: string[];
let hostOptions: Record<string, unknown> | undefined;
let hostClosed: boolean;
let hostWait: (input: WaitInput) => Promise<Completion>;
let waitStarted: () => void;
let authenticateOverride: ((input: Record<string, unknown>) => Promise<void>) | undefined;
let authenticateInputs: Array<Record<string, unknown>>;
let profileDuringWait: Profile | undefined;

function makeProfile(overrides: Profile = {}): Profile {
  return {
    profileId: "test-agent",
    displayName: "Test Agent",
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    environment: "production",
    bffBaseUrl: "https://global.api.prd.ledger.com/agent-intent",
    publicKey: AGENT_PUBLIC_KEY,
    trustchainId: "app18-root",
    accountAccess: ACCOUNT_ACCESS,
    enrollmentExpiresAt: "2026-01-01T00:30:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCompletion(): Completion {
  return {
    version: 3,
    recovery: true,
    agentPubkey: AGENT_PUBLIC_KEY,
    previousTrustchainId: "app18-root",
    requestSignature: REQUEST_SIGNATURE,
    trustchainId: "app18-root",
  };
}

/** Mirrors the SDK host: a failed authenticate drops the candidate, so the wait ends in a timeout. */
async function relayDelivers(input: WaitInput): Promise<Completion> {
  profileDuringWait = storedProfile;
  const completion = makeCompletion();
  try {
    await input.authenticate(completion);
  } catch {
    throw new Error("Enrollment completion timed out.");
  }
  await input.persist(completion);
  return completion;
}

function makeSession() {
  sessionReadCalls++;
  const profile = storedProfile;
  let staged = profile;
  return {
    getAgentIntentProfile: (_profileId: string) => profile,
    invalidAgentIntentProfileIds: invalidProfileIds,
    updateAgentIntentProfile: (_profileId: string, patch: Profile) => {
      staged = { ...staged, ...patch };
    },
    write: () => {
      storedProfile = staged;
    },
  };
}

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => makeSession(),
    noopSessionLock: true,
    keychain: {
      loadAgentIntentSecretKey: async (_profileId: string) => {
        if (keychainError) throw keychainError;
        return keychainSecretKey;
      },
    },
    sdk: {
      createSoftwareAgentIdentity: (secretKey: unknown) => {
        identityInputs.push(secretKey);
        return { publicKey: keychainPublicKey, exportSecretKey: () => SECRET_KEY };
      },
      createAgentRecoveryRequest: (_identity: unknown, input: Record<string, unknown>) => {
        requestInputs.push(input);
        return {
          version: "3",
          recovery: true,
          publicKey: AGENT_PUBLIC_KEY,
          ...input,
          signature: REQUEST_SIGNATURE,
        };
      },
      createAgentRecoveryUrl: (appUrl: string, _request: unknown) => {
        recoveryUrlInputs.push(appUrl);
        return `${appUrl}#recovery=opaque`;
      },
      createAgentEnrollmentChannelHost: (options: { environment: string }) => {
        hostOptions = options;
        return {
          binding: { environment: options.environment, hostPublicKey: HOST_PUBLIC_KEY },
          waitForCompletion: (input: WaitInput) => {
            waitStarted();
            return hostWait(input);
          },
          close: () => {
            hostClosed = true;
          },
        };
      },
    },
    completionAuth: {
      get authenticateRecoveryCompletion() {
        return authenticateOverride;
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: recoverCommand } = await import("./recover");

type RecoverFlags = {
  profile: string;
  "app-url"?: string;
  "expires-in": string;
  output?: "human" | "json";
};

function runRecover(overrides: Partial<RecoverFlags> = {}) {
  const flags: RecoverFlags = { profile: "test-agent", "expires-in": "30m", ...overrides };
  return (
    recoverCommand as unknown as { handler: (args: { flags: RecoverFlags }) => Promise<void> }
  ).handler({ flags });
}

describe("agent-intent recover", () => {
  let restore: () => void;
  let stdout: string[];

  beforeEach(() => {
    storedProfile = makeProfile();
    invalidProfileIds = [];
    sessionReadCalls = 0;
    keychainSecretKey = SECRET_KEY;
    keychainError = undefined;
    keychainPublicKey = AGENT_PUBLIC_KEY;
    identityInputs = [];
    requestInputs = [];
    recoveryUrlInputs = [];
    hostOptions = undefined;
    hostClosed = false;
    hostWait = input => relayDelivers(input);
    waitStarted = () => {};
    authenticateInputs = [];
    authenticateOverride = input => {
      authenticateInputs.push(input);
      return Promise.resolve();
    };
    profileDuringWait = undefined;
    stdout = [];
    restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: () => {} });
  });

  afterEach(() => restore());

  describe("pre-checks", () => {
    it("rejects an unknown profile", async () => {
      storedProfile = undefined;

      await expect(runRecover()).rejects.toThrow('No Agent Intent profile named "test-agent".');
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a profile id that matches an invalid session record", async () => {
      storedProfile = undefined;
      invalidProfileIds = ["test-agent"];

      await expect(runRecover()).rejects.toThrow(/failed to load \(invalid session record\)/);
    });

    it("rejects a pending profile that never completed enrollment", async () => {
      storedProfile = makeProfile({ trustchainId: undefined, accountAccess: undefined });

      await expect(runRecover()).rejects.toThrow(
        /has not completed enrollment.*agent-intent enroll/,
      );
      expect(identityInputs).toEqual([]);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a source that does not support recovery", async () => {
      storedProfile = makeProfile({ source: "codex" });

      await expect(runRecover()).rejects.toThrow(
        'Agent Intent recovery supports only openclaw, hermes agents; profile "test-agent" is a ' +
          "codex agent. Enroll a fresh profile under a new --profile id instead.",
      );
      expect(hostOptions).toBeUndefined();
    });

    it.each(["https://user:secret@keycloak.example.com/", "file:///etc/keycloak", "not a url"])(
      "rejects a stored keycloak override %p before authenticating against it",
      async url => {
        storedProfile = makeProfile({ keycloakBaseUrl: url });

        await expect(runRecover()).rejects.toThrow(
          'Agent Intent profile "test-agent" has an invalid stored Keycloak URL',
        );
        expect(identityInputs).toEqual([]);
        expect(hostOptions).toBeUndefined();
      },
    );

    it("fails closed when the OS keychain cannot be read", async () => {
      keychainError = new Error("keychain locked");

      await expect(runRecover()).rejects.toThrow(
        /Could not read the agent key of profile "test-agent".*keychain locked/,
      );
      expect(storedProfile?.pendingRecovery).toBeUndefined();
    });

    it("rejects a profile whose keychain key is missing", async () => {
      keychainSecretKey = null;

      await expect(runRecover()).rejects.toThrow(/No agent key found in the OS keychain/);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a keychain key that does not match the recorded public key", async () => {
      keychainPublicKey = OTHER_PUBLIC_KEY;

      await expect(runRecover()).rejects.toThrow(/does not match its recorded public key/);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects an invalid --expires-in before reading the session", async () => {
      await expect(runRecover({ "expires-in": "0s" })).rejects.toThrow(/--expires-in "0s"/);
      expect(sessionReadCalls).toBe(0);
    });

    it("rejects an --app-url carrying URL credentials before it could leak into the recovery URL", async () => {
      await expect(
        runRecover({ "app-url": "https://user:secret@example.com/agent" }),
      ).rejects.toThrow(/--app-url must not contain URL credentials/);
      expect(recoveryUrlInputs).toEqual([]);
    });
  });

  describe("relay completion", () => {
    it("signs a recovery of the same key into the previous trustchain, bound to a relay host", async () => {
      await runRecover();

      expect(identityInputs).toEqual([SECRET_KEY]);
      expect(hostOptions).toMatchObject({
        environment: "production",
        relayBaseUrl: "https://trustchain.api.live.ledger.com",
        timeouts: { candidateTimeoutMs: 30 * 60_000, completionTimeoutMs: 30 * 60_000 },
      });
      expect(requestInputs[0]).toMatchObject({
        name: "Test Agent",
        description: "Remote agent that proposes intents for review.",
        source: "openclaw",
        previousTrustchainId: "app18-root",
        channel: { environment: "production", hostPublicKey: HOST_PUBLIC_KEY },
      });
      expect(recoveryUrlInputs).toEqual(["https://agent-intent.ledger.com/"]);
    });

    it("uses the profile's staging relay", async () => {
      storedProfile = makeProfile({ environment: "staging" });

      await runRecover();

      expect(hostOptions).toMatchObject({
        relayBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      });
    });

    it("marks the profile as recovering while waiting for approval", async () => {
      await runRecover();

      expect(profileDuringWait?.pendingRecovery).toEqual({
        previousTrustchainId: "app18-root",
        requestSignature: REQUEST_SIGNATURE,
        expiresAt: expect.any(String),
      });
    });

    it("keeps the trustchain and account access and clears the marker once authenticated", async () => {
      await runRecover();

      expect(storedProfile).toMatchObject({
        publicKey: AGENT_PUBLIC_KEY,
        trustchainId: "app18-root",
        accountAccess: ACCOUNT_ACCESS,
      });
      expect(storedProfile?.pendingRecovery).toBeUndefined();
      expect(hostClosed).toBe(true);
      expect(stdout.join("")).toContain('Agent Intent profile "test-agent" recovered');
    });

    it("authenticates with the profile's keycloak override", async () => {
      storedProfile = makeProfile({ keycloakBaseUrl: "https://keycloak.example.com/" });

      await runRecover();

      expect(authenticateInputs[0]).toMatchObject({
        environment: "production",
        completion: { trustchainId: "app18-root" },
        keycloak: { baseUrl: "https://keycloak.example.com/", realm: "agent-intent-customers" },
      });
    });

    it("emits the pending recovery before the final recovered result in json mode", async () => {
      await runRecover({ output: "json" });

      const lines = stdout
        .join("")
        .trim()
        .split("\n")
        .map(l => JSON.parse(l));
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({
        type: "recovery-pending",
        command: "agent-intent recover",
        profileId: "test-agent",
        recoveryUrl: expect.stringContaining("#recovery=opaque"),
        fingerprint: expect.any(String),
        expiresAt: expect.any(String),
      });
      expect(lines[1]).toMatchObject({
        status: "success",
        profileId: "test-agent",
        trustchainId: "app18-root",
        recovered: true,
      });
    });

    it("never prints the agent secret key", async () => {
      await runRecover({ output: "json" });
      await runRecover();

      expect(stdout.join("")).not.toContain(SECRET_KEY);
    });

    it("clears the marker and keeps the previous enrollment when authentication fails", async () => {
      authenticateOverride = () => Promise.reject(new Error("not a trustchain member"));

      await expect(runRecover()).rejects.toThrow(
        /Recovery did not complete \(Enrollment completion timed out\.\).*keeps its previous enrollment/s,
      );
      expect(storedProfile).toMatchObject({
        trustchainId: "app18-root",
        accountAccess: ACCOUNT_ACCESS,
      });
      expect(storedProfile?.pendingRecovery).toBeUndefined();
      expect(hostClosed).toBe(true);
    });

    it("clears the marker when the relay times out", async () => {
      hostWait = () => Promise.reject(new Error("Enrollment completion timed out."));

      await expect(runRecover()).rejects.toThrow(
        'Recovery did not complete (Enrollment completion timed out.). Profile "test-agent" ' +
          "keeps its previous enrollment — run `agent-intent recover` again to retry.",
      );
      expect(storedProfile?.pendingRecovery).toBeUndefined();
      expect(storedProfile?.trustchainId).toBe("app18-root");
    });

    it("closes the relay host and clears the marker on SIGINT", async () => {
      const otherListeners = process.listeners("SIGINT");
      process.removeAllListeners("SIGINT");
      try {
        const started = new Promise<void>(resolve => {
          waitStarted = resolve;
        });
        hostWait = () => new Promise<never>(() => {});

        const recovery = runRecover();
        await started;
        process.emit("SIGINT");

        await expect(recovery).rejects.toThrow(/did not complete \(Recovery interrupted\.\)/);
        expect(hostClosed).toBe(true);
        expect(storedProfile?.pendingRecovery).toBeUndefined();
        expect(process.listenerCount("SIGINT")).toBe(0);
      } finally {
        for (const listener of otherListeners) process.on("SIGINT", listener);
      }
    });

    it("refuses to persist when the profile was removed while waiting for approval", async () => {
      hostWait = input => {
        storedProfile = undefined;
        return relayDelivers(input);
      };

      await expect(runRecover()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile).toBeUndefined();
    });

    it("refuses to persist when the profile's public key changed while waiting for approval", async () => {
      hostWait = input => {
        storedProfile = { ...storedProfile, publicKey: OTHER_PUBLIC_KEY };
        return relayDelivers(input);
      };

      await expect(runRecover()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.publicKey).toBe(OTHER_PUBLIC_KEY);
    });

    it("refuses to persist, and leaves the newer marker alone, when another recovery replaced it", async () => {
      const newerMarker = {
        previousTrustchainId: "app18-root",
        requestSignature: "cd".repeat(64),
        expiresAt: "2026-01-01T01:00:00.000Z",
      };
      hostWait = input => {
        storedProfile = { ...storedProfile, pendingRecovery: newerMarker };
        return relayDelivers(input);
      };

      await expect(runRecover()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.pendingRecovery).toEqual(newerMarker);
    });

    it("reports recovered when the completion was persisted but the relay acknowledgement failed", async () => {
      hostWait = async input => {
        await relayDelivers(input);
        throw new Error("Enrollment relay closed before completion was acknowledged.");
      };

      await runRecover();

      expect(storedProfile?.pendingRecovery).toBeUndefined();
      expect(stdout.join("")).toContain('Agent Intent profile "test-agent" recovered');
    });
  });
});
