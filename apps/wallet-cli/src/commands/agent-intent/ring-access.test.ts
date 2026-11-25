import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DETACHED_LISTENER_ENV } from "../../analytics/lifecycle-analytics";
import { installOutputCapture } from "../../shared/ui";
import { pointStateHomeAt } from "../../testing/state-home";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const AGENT_PUBLIC_KEY = "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076";
const ENCRYPTION_PUBLIC_KEY = "03".padEnd(66, "e");
const NEW_ENCRYPTION_PUBLIC_KEY = "02".padEnd(66, "f");
const HOST_PUBLIC_KEY = "03a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
const AGENT_SECRET_KEY = "5ec2e7".padEnd(64, "0");
const ENCRYPTION_SECRET_KEY = "e5c2e7".padEnd(64, "0");
const NEW_ENCRYPTION_SECRET_KEY = "ae5c2e".padEnd(64, "0");
const REQUEST_SIGNATURE = "ab".repeat(64);
const KEY_RING_PATH = "m/0'/17'/0'";

type Profile = Record<string, unknown>;
type Completion = {
  version: 4;
  agentPubkey: string;
  encryptionPublicKey: string;
  requestSignature: string;
  environment: "staging" | "production";
  trustchainId: string;
  applicationPath: string;
};
type WaitInput = {
  request: Record<string, unknown>;
  authenticate: (completion: Completion) => Promise<void>;
  persist: (completion: Completion) => Promise<void>;
};
type FakeIdentity = { publicKey: string; exportSecretKey: () => string };
type FakeChild = { pid: number; kill: () => void };

let storedProfile: Profile | undefined;
let sessionWriteError: Error | undefined;
let keychainSecrets: Map<string, string>;
let encryptionKeyFiles: Map<string, string>;
let deletedEncryptionKeys: string[];
let requestInputs: Array<Record<string, unknown>>;
let ringAccessUrlInputs: string[];
let hostOptions: Record<string, unknown> | undefined;
let hostClosed: boolean;
let hostWait: (input: WaitInput) => Promise<Completion>;
let waitStarted: () => void;
let authenticateInputs: Array<Record<string, unknown>>;
let authenticateError: Error | undefined;
let profileDuringWait: Profile | undefined;
let spawnedCommands: string[][];
let firstLogLine: () => Promise<Record<string, unknown> | undefined>;
let childKilled: boolean;

function makeProfile(overrides: Profile = {}): Profile {
  return {
    profileId: "test-agent",
    displayName: "Test Agent",
    description: "Remote agent that proposes intents for review.",
    source: "claude-code",
    environment: "production",
    bffBaseUrl: "https://global.api.prd.ledger.com/agent-intent",
    publicKey: AGENT_PUBLIC_KEY,
    keyStore: "os-keychain",
    trustchainId: "app18-root",
    enrollmentExpiresAt: "2026-01-01T00:30:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function granted(overrides: Partial<Completion> = {}): Completion {
  return {
    version: 4,
    agentPubkey: AGENT_PUBLIC_KEY,
    encryptionPublicKey: String(storedProfile?.encryptionPublicKey ?? NEW_ENCRYPTION_PUBLIC_KEY),
    requestSignature: REQUEST_SIGNATURE,
    environment: "production",
    trustchainId: "app18-root",
    applicationPath: KEY_RING_PATH,
    ...overrides,
  };
}

async function relayDelivers(input: WaitInput, completion = granted()): Promise<Completion> {
  profileDuringWait = storedProfile;
  try {
    await input.authenticate(completion);
  } catch {
    await Bun.sleep(Math.max(0, Date.parse(String(input.request.expiresAt)) - Date.now()));
    throw new Error("Enrollment completion timed out.");
  }
  await input.persist(completion);
  return completion;
}

async function relayRejects(): Promise<Completion> {
  profileDuringWait = storedProfile;
  throw new realAgentIntentSdk.AgentEnrollmentRejectedError("ring-access");
}

function makeSession() {
  const profile = storedProfile;
  let staged = profile;
  return {
    getAgentIntentProfile: (_profileId: string) => profile,
    invalidAgentIntentProfileIds: [],
    updateAgentIntentProfile: (_profileId: string, patch: Profile) => {
      staged = { ...staged, ...patch };
    },
    write: () => {
      if (sessionWriteError) throw sessionWriteError;
      storedProfile = staged;
    },
  };
}

function fakeIdentity(secretKey?: string): FakeIdentity {
  const publicKeys: Record<string, string> = {
    [AGENT_SECRET_KEY]: AGENT_PUBLIC_KEY,
    [ENCRYPTION_SECRET_KEY]: ENCRYPTION_PUBLIC_KEY,
  };
  if (secretKey !== undefined && !/^[0-9a-f]{64}$/.test(secretKey)) {
    throw new Error("secret key is not a valid secp256k1 scalar.");
  }
  if (secretKey === undefined) {
    return {
      publicKey: NEW_ENCRYPTION_PUBLIC_KEY,
      exportSecretKey: () => NEW_ENCRYPTION_SECRET_KEY,
    };
  }
  return {
    publicKey: publicKeys[secretKey] ?? "02".padEnd(66, "9"),
    exportSecretKey: () => secretKey,
  };
}

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => makeSession(),
    noopSessionLock: true,
    keychain: {
      loadAgentIntentSecretKey: async () => AGENT_SECRET_KEY,
      loadAgentIntentEncryptionKey: async (profileId: string, agentPublicKey: string) =>
        keychainSecrets.get(`${profileId}/${agentPublicKey}`) ?? null,
      saveAgentIntentEncryptionKey: async (
        profileId: string,
        agentPublicKey: string,
        secretKey: string,
      ) => {
        keychainSecrets.set(`${profileId}/${agentPublicKey}`, secretKey);
      },
      deleteAgentIntentEncryptionKey: (profileId: string, agentPublicKey: string) => {
        deletedEncryptionKeys.push(profileId);
        return keychainSecrets.delete(`${profileId}/${agentPublicKey}`);
      },
    },
    keyFile: {
      loadAgentIntentKeyFile: () => AGENT_SECRET_KEY,
      loadAgentIntentEncryptionKeyFile: (profileId: string, agentPublicKey: string) =>
        encryptionKeyFiles.get(`${profileId}/${agentPublicKey}`) ?? null,
      saveAgentIntentEncryptionKeyFile: (
        profileId: string,
        agentPublicKey: string,
        secretKey: string,
      ) => {
        encryptionKeyFiles.set(`${profileId}/${agentPublicKey}`, secretKey);
      },
      deleteAgentIntentEncryptionKeyFile: (profileId: string, agentPublicKey: string) =>
        encryptionKeyFiles.delete(`${profileId}/${agentPublicKey}`),
    },
    sdk: {
      createSoftwareAgentIdentity: (secretKey?: string) => fakeIdentity(secretKey),
      createAgentRingAccessRequest: (identity: FakeIdentity, input: Record<string, unknown>) => {
        requestInputs.push(input);
        return {
          version: "4",
          publicKey: identity.publicKey,
          ...input,
          signature: REQUEST_SIGNATURE,
        };
      },
      createAgentRingAccessUrl: (appUrl: string) => {
        ringAccessUrlInputs.push(appUrl);
        return `${appUrl}agents/ring-access?v=4&opaque`;
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
      authenticateRingAccessCompletion: async (input: Record<string, unknown>) => {
        authenticateInputs.push(input);
        if (authenticateError) throw authenticateError;
      },
    },
    detach: {
      spawnDetached: (command: string[]): FakeChild => {
        spawnedCommands.push(command);
        return {
          pid: 4242,
          kill: () => {
            childKilled = true;
          },
        };
      },
      readFirstLogJsonLine: () => firstLogLine(),
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

let stateHome: string;
let restoreStateHome: () => void;
beforeAll(() => {
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-ring-access-test-"));
  restoreStateHome = pointStateHomeAt(stateHome);
});
afterAll(() => {
  restoreStateHome();
  rmSync(stateHome, { recursive: true, force: true });
});

const { default: ringAccessCommand } = await import("./ring-access");
const { listenerPaths, withListenerLock } = await import("../../agent-intent/detach");

type RingAccessFlags = {
  profile: string;
  "app-url"?: string;
  "expires-in": string;
  detach?: boolean;
  output?: "human" | "json";
};

function runRingAccess(overrides: Partial<RingAccessFlags> = {}) {
  const flags: RingAccessFlags = { profile: "test-agent", "expires-in": "30m", ...overrides };
  return (
    ringAccessCommand as unknown as { handler: (args: { flags: RingAccessFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonLines(stdout: string[]): Array<Record<string, unknown>> {
  return stdout
    .join("")
    .trim()
    .split("\n")
    .map(line => JSON.parse(line));
}

const KEY_ID = `test-agent/${AGENT_PUBLIC_KEY}`;

let restore: () => void;
let stdout: string[];
let stderr: string[];

beforeEach(() => {
  storedProfile = makeProfile({ encryptionPublicKey: ENCRYPTION_PUBLIC_KEY });
  sessionWriteError = undefined;
  keychainSecrets = new Map([[KEY_ID, ENCRYPTION_SECRET_KEY]]);
  encryptionKeyFiles = new Map();
  deletedEncryptionKeys = [];
  requestInputs = [];
  ringAccessUrlInputs = [];
  hostOptions = undefined;
  hostClosed = false;
  hostWait = input => relayDelivers(input);
  waitStarted = () => {};
  authenticateInputs = [];
  authenticateError = undefined;
  profileDuringWait = undefined;
  spawnedCommands = [];
  firstLogLine = async () => undefined;
  childKilled = false;
  stdout = [];
  stderr = [];
  restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: s => stderr.push(s) });
});

afterEach(() => restore());

describe("agent-intent ring-access", () => {
  describe("pre-checks", () => {
    it("rejects an unknown profile", async () => {
      storedProfile = undefined;

      await expect(runRingAccess()).rejects.toThrow('No Agent Intent profile named "test-agent"');
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a profile that has not completed enrollment", async () => {
      storedProfile = makeProfile({ trustchainId: undefined });

      await expect(runRingAccess()).rejects.toThrow(/is not enrolled yet/);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects an invalid --expires-in", async () => {
      await expect(runRingAccess({ "expires-in": "0s" })).rejects.toThrow(/--expires-in "0s"/);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects an --app-url carrying URL credentials", async () => {
      await expect(
        runRingAccess({ "app-url": "https://user:secret@example.com/" }),
      ).rejects.toThrow(/--app-url must not contain URL credentials/);
      expect(ringAccessUrlInputs).toEqual([]);
    });

    it("refuses to run while another ring access listener holds the profile", async () => {
      await withListenerLock("ring-access", "test-agent", async () => {
        await expect(runRingAccess()).rejects.toThrow(
          `A ring access listener for profile "test-agent" is already running (pid ${process.pid}).`,
        );
      });
      expect(hostOptions).toBeUndefined();
    });
  });

  describe("encryption key", () => {
    it("creates an encryption key in the OS keychain and records it on the first run", async () => {
      storedProfile = makeProfile();
      keychainSecrets.clear();

      await runRingAccess();

      expect(keychainSecrets.get(KEY_ID)).toBe(NEW_ENCRYPTION_SECRET_KEY);
      expect(storedProfile?.encryptionPublicKey).toBe(NEW_ENCRYPTION_PUBLIC_KEY);
      expect(requestInputs[0]).toMatchObject({ encryptionPublicKey: NEW_ENCRYPTION_PUBLIC_KEY });
    });

    it("stores the encryption key in a key file for a plaintext-file profile, and says so", async () => {
      storedProfile = makeProfile({ keyStore: "plaintext-file" });
      keychainSecrets.clear();

      await runRingAccess({ output: "json" });

      expect(encryptionKeyFiles.get(KEY_ID)).toBe(NEW_ENCRYPTION_SECRET_KEY);
      expect(keychainSecrets.size).toBe(0);
      expect(stderr.join("")).toContain(
        'Profile "test-agent" stores its encryption key unencrypted in',
      );
      expect(jsonLines(stdout)[0]).toMatchObject({ keyStore: "plaintext-file" });
    });

    it("replaces a stored encryption key that is not a valid key", async () => {
      storedProfile = makeProfile();
      keychainSecrets.set(KEY_ID, "not-a-key");

      await runRingAccess();

      expect(keychainSecrets.get(KEY_ID)).toBe(NEW_ENCRYPTION_SECRET_KEY);
      expect(storedProfile?.encryptionPublicKey).toBe(NEW_ENCRYPTION_PUBLIC_KEY);
    });

    it("adopts an encryption key already stored for the profile instead of replacing it", async () => {
      storedProfile = makeProfile();

      await runRingAccess();

      expect(keychainSecrets.get(KEY_ID)).toBe(ENCRYPTION_SECRET_KEY);
      expect(storedProfile?.encryptionPublicKey).toBe(ENCRYPTION_PUBLIC_KEY);
      expect(requestInputs[0]).toMatchObject({ encryptionPublicKey: ENCRYPTION_PUBLIC_KEY });
    });

    it("keeps an adopted encryption key when the profile cannot record it", async () => {
      storedProfile = makeProfile();
      sessionWriteError = new Error("disk full");

      await expect(runRingAccess()).rejects.toThrow("disk full");
      expect(deletedEncryptionKeys).toEqual([]);
      expect(keychainSecrets.get(KEY_ID)).toBe(ENCRYPTION_SECRET_KEY);
    });

    it("accepts a recorded encryption key written in upper case", async () => {
      storedProfile = makeProfile({ encryptionPublicKey: ENCRYPTION_PUBLIC_KEY.toUpperCase() });

      await runRingAccess();

      expect(storedProfile?.ringAccess).toMatchObject({ applicationPath: KEY_RING_PATH });
    });

    it("reuses the recorded encryption key", async () => {
      await runRingAccess();

      expect(keychainSecrets.get(KEY_ID)).toBe(ENCRYPTION_SECRET_KEY);
      expect(requestInputs[0]).toMatchObject({ encryptionPublicKey: ENCRYPTION_PUBLIC_KEY });
      expect(authenticateInputs[0]?.encryptionIdentity).toMatchObject({
        publicKey: ENCRYPTION_PUBLIC_KEY,
      });
    });

    it("removes the new encryption key when the profile cannot record it", async () => {
      storedProfile = makeProfile();
      keychainSecrets.clear();
      sessionWriteError = new Error("disk full");

      await expect(runRingAccess()).rejects.toThrow("disk full");
      expect(deletedEncryptionKeys).toEqual(["test-agent"]);
      expect(keychainSecrets.size).toBe(0);
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a stored encryption key that does not match the recorded one", async () => {
      keychainSecrets.set(KEY_ID, NEW_ENCRYPTION_SECRET_KEY);

      await expect(runRingAccess()).rejects.toThrow(
        /does not match its recorded encryption public key/,
      );
      expect(hostOptions).toBeUndefined();
    });

    it("rejects a recorded encryption key that is missing from the OS keychain", async () => {
      keychainSecrets.clear();

      await expect(runRingAccess()).rejects.toThrow(
        /OS keychain encryption key of profile "test-agent" is missing/,
      );
      expect(hostOptions).toBeUndefined();
    });
  });

  describe("relay completion", () => {
    it("signs a ring access request for the profile's agent, bound to a relay host", async () => {
      await runRingAccess();

      expect(hostOptions).toMatchObject({
        environment: "production",
        relayBaseUrl: "https://trustchain.api.live.ledger.com",
        timeouts: { candidateTimeoutMs: 30 * 60_000, completionTimeoutMs: 30 * 60_000 },
      });
      expect(requestInputs[0]).toMatchObject({
        encryptionPublicKey: ENCRYPTION_PUBLIC_KEY,
        name: "Test Agent",
        description: "Remote agent that proposes intents for review.",
        source: "claude-code",
        trustchainId: "app18-root",
        channel: { environment: "production", hostPublicKey: HOST_PUBLIC_KEY },
      });
      expect(ringAccessUrlInputs).toEqual(["https://app.agents.ledger.com/"]);
    });

    it("marks the profile as requesting ring access while waiting", async () => {
      await runRingAccess();

      expect(profileDuringWait?.pendingRingAccess).toEqual({
        requestSignature: REQUEST_SIGNATURE,
        expiresAt: expect.any(String),
      });
    });

    it("authenticates the grant with the encryption key on the profile's environment", async () => {
      await runRingAccess();

      expect(authenticateInputs[0]).toMatchObject({
        environment: "production",
        completion: { applicationPath: KEY_RING_PATH },
      });
    });

    it("records the grant and clears the marker", async () => {
      await runRingAccess();

      expect(storedProfile?.ringAccess).toEqual({
        environment: "production",
        trustchainId: "app18-root",
        applicationPath: KEY_RING_PATH,
        encryptionPublicKey: ENCRYPTION_PUBLIC_KEY,
      });
      expect(storedProfile?.pendingRingAccess).toBeUndefined();
      expect(hostClosed).toBe(true);
      expect(stdout.join("")).toContain(
        `Agent Intent profile "test-agent" has Ledger Key Ring access at ${KEY_RING_PATH}`,
      );
    });

    it("emits the pending request before the granted result in json mode", async () => {
      await runRingAccess({ output: "json" });

      const lines = jsonLines(stdout);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({
        type: "ring-access-pending",
        command: "agent-intent ring-access",
        profileId: "test-agent",
        ringAccessUrl: "https://app.agents.ledger.com/agents/ring-access?v=4&opaque",
        fingerprint: expect.any(String),
        expiresAt: expect.any(String),
      });
      expect(lines[1]).toMatchObject({
        status: "success",
        profileId: "test-agent",
        environment: "production",
        trustchainId: "app18-root",
        applicationPath: KEY_RING_PATH,
        encryptionPublicKey: ENCRYPTION_PUBLIC_KEY,
        granted: true,
      });
    });

    it("never prints a secret key", async () => {
      storedProfile = makeProfile();
      keychainSecrets.clear();

      await runRingAccess({ output: "json" });

      const printed = stdout.join("");
      expect(printed).not.toContain(AGENT_SECRET_KEY);
      expect(printed).not.toContain(NEW_ENCRYPTION_SECRET_KEY);
    });

    it("fails with ring_access_declined, keeps the key and records no grant on a decline", async () => {
      hostWait = () => relayRejects();

      await expect(runRingAccess({ output: "json" })).rejects.toMatchObject({ code: 1 });

      expect(jsonLines(stdout)[1]).toMatchObject({
        ok: false,
        error: { code: "ring_access_declined", message: expect.stringContaining("was declined") },
      });
      expect(authenticateInputs).toEqual([]);
      expect(storedProfile?.pendingRingAccess).toBeUndefined();
      expect(storedProfile?.ringAccess).toBeUndefined();
      expect(storedProfile?.encryptionPublicKey).toBe(ENCRYPTION_PUBLIC_KEY);
      expect(keychainSecrets.get(KEY_ID)).toBe(ENCRYPTION_SECRET_KEY);
    });

    it("keeps an earlier grant when a later request is declined", async () => {
      const earlier = {
        environment: "production",
        trustchainId: "app18-root",
        applicationPath: KEY_RING_PATH,
        encryptionPublicKey: ENCRYPTION_PUBLIC_KEY,
      };
      storedProfile = makeProfile({
        encryptionPublicKey: ENCRYPTION_PUBLIC_KEY,
        ringAccess: earlier,
      });
      hostWait = () => relayRejects();

      await expect(runRingAccess()).rejects.toThrow(/was declined/);
      expect(storedProfile?.ringAccess).toEqual(earlier);
    });

    it("fails with ring_access_failed and the refusal at expiry, keeping the key, when the grant cannot be authenticated", async () => {
      authenticateError = new Error("not a Key Ring member");

      await expect(runRingAccess({ "expires-in": "1s", output: "json" })).rejects.toMatchObject({
        code: 1,
      });
      expect(jsonLines(stdout)[1]).toMatchObject({
        error: {
          code: "ring_access_failed",
          message: expect.stringMatching(
            /Ring access did not complete \(the grant was refused: not a Key Ring member\).*keeps its encryption key/s,
          ),
        },
      });
      expect(stderr.join("")).toContain("Ring access grant was refused: not a Key Ring member\n");
      expect(storedProfile?.ringAccess).toBeUndefined();
      expect(storedProfile?.pendingRingAccess).toBeUndefined();
      expect(storedProfile?.encryptionPublicKey).toBe(ENCRYPTION_PUBLIC_KEY);
    });

    it("fails with ring_access_expired when the link expired without an answer", async () => {
      hostWait = async () => {
        await Bun.sleep(1_100);
        throw new Error("Enrollment completion timed out.");
      };

      await expect(runRingAccess({ "expires-in": "1s", output: "json" })).rejects.toMatchObject({
        code: 1,
      });
      expect(jsonLines(stdout)[1]).toMatchObject({ error: { code: "ring_access_expired" } });
      expect(storedProfile?.pendingRingAccess).toBeUndefined();
    });

    it("forgets the log of an earlier --detach run, which no longer tells this run's outcome", async () => {
      const { logPath } = listenerPaths("ring-access", "test-agent");
      mkdirSync(dirname(logPath), { recursive: true });
      writeFileSync(logPath, '{"ok":false,"error":{"message":"old"}}\n');

      await runRingAccess();

      expect(existsSync(logPath)).toBe(false);
    });

    it("keeps the log it writes to when it runs as the --detach listener", async () => {
      const { logPath } = listenerPaths("ring-access", "test-agent");
      mkdirSync(dirname(logPath), { recursive: true });
      writeFileSync(logPath, '{"type":"ring-access-pending"}\n');
      process.env[DETACHED_LISTENER_ENV] = "1";
      try {
        await runRingAccess();
      } finally {
        delete process.env[DETACHED_LISTENER_ENV];
      }

      expect(existsSync(logPath)).toBe(true);
    });

    it("clears the marker and closes the relay host on SIGINT", async () => {
      const otherListeners = process.listeners("SIGINT");
      process.removeAllListeners("SIGINT");
      try {
        const started = new Promise<void>(resolve => {
          waitStarted = resolve;
        });
        hostWait = () => new Promise<never>(() => {});

        const request = runRingAccess();
        await started;
        process.emit("SIGINT");

        await expect(request).rejects.toThrow(/did not complete \(Ring access interrupted\.\)/);
        expect(hostClosed).toBe(true);
        expect(storedProfile?.pendingRingAccess).toBeUndefined();
      } finally {
        for (const listener of otherListeners) process.on("SIGINT", listener);
      }
    });

    it("refuses to record the outcome when the encryption key changed while waiting", async () => {
      hostWait = input => {
        storedProfile = { ...storedProfile, encryptionPublicKey: NEW_ENCRYPTION_PUBLIC_KEY };
        return relayDelivers(input);
      };

      await expect(runRingAccess()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.ringAccess).toBeUndefined();
    });

    it("refuses to record the outcome when another request replaced the marker", async () => {
      const newerMarker = {
        requestSignature: "cd".repeat(64),
        expiresAt: "2026-01-01T01:00:00.000Z",
      };
      hostWait = input => {
        storedProfile = { ...storedProfile, pendingRingAccess: newerMarker };
        return relayDelivers(input);
      };

      await expect(runRingAccess()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.pendingRingAccess).toEqual(newerMarker);
    });
  });
});

describe("agent-intent ring-access --detach", () => {
  const pendingLine = {
    type: "ring-access-pending",
    command: "agent-intent ring-access",
    network: "all",
    profileId: "test-agent",
    ringAccessUrl: "https://app.agents.ledger.com/agents/ring-access?v=4&opaque",
    fingerprint: "AB12 CD34",
    expiresAt: "2026-10-21T12:30:00.000Z",
    keyStore: "os-keychain",
  };

  beforeEach(() => {
    firstLogLine = async () => pendingLine;
    rmSync(listenerPaths("ring-access", "test-agent").logPath, { force: true });
  });

  it("re-runs ring-access in the background with the flags not at their default", async () => {
    await runRingAccess({ detach: true, "expires-in": "2h" });

    const command = spawnedCommands[0];
    expect(command.slice(command.indexOf("agent-intent"))).toEqual([
      "agent-intent",
      "ring-access",
      "--profile=test-agent",
      "--expires-in=2h",
      "--output=json",
    ]);
    expect(hostOptions).toBeUndefined();
  });

  it("prints the listener's pending line with its pid and log path in json mode", async () => {
    await runRingAccess({ detach: true, output: "json" });

    expect(jsonLines(stdout)).toEqual([
      {
        ...pendingLine,
        listenerPid: 4242,
        logPath: listenerPaths("ring-access", "test-agent").logPath,
      },
    ]);
  });

  it("tells the human to run agent-intent wait", async () => {
    await runRingAccess({ detach: true });

    expect(stdout.join("")).toContain("Run `wallet-cli agent-intent wait --profile test-agent`");
  });

  it("refuses a profile that is not enrolled before starting a listener", async () => {
    storedProfile = makeProfile({ trustchainId: undefined });

    await expect(runRingAccess({ detach: true })).rejects.toThrow(/is not enrolled yet/);
    expect(spawnedCommands).toEqual([]);
  });

  it("reports a listener still starting as waiting", async () => {
    firstLogLine = async () => undefined;

    await runRingAccess({ detach: true, output: "json" });

    expect(jsonLines(stdout)[0]).toMatchObject({
      type: "ring-access-waiting",
      profileId: "test-agent",
      listenerPid: 4242,
    });
  });

  it("fails with the listener's own error code", async () => {
    firstLogLine = async () => ({
      ok: false,
      error: { command: "agent-intent ring-access", code: "some_code", message: "boom" },
    });

    await expect(runRingAccess({ detach: true, output: "json" })).rejects.toMatchObject({
      code: 1,
    });
    expect(jsonLines(stdout)[0]).toMatchObject({ ok: false, error: { code: "some_code" } });
  });

  it("stops the listener when its first line is neither pending nor an error", async () => {
    firstLogLine = async () => ({ status: "success" });

    await expect(runRingAccess({ detach: true })).rejects.toThrow(/unexpected first line/);
    expect(childKilled).toBe(true);
  });
});
