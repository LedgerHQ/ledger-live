import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";

const AGENT_PUBLIC_KEY = "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076";
const HOST_PUBLIC_KEY = "03a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

type Profile = Record<string, unknown>;
type Completion = {
  version: 2;
  agentPubkey: string;
  trustchainId: string;
  accountAccess: {
    mode: "direct-app16-key-reader";
    environment: "staging" | "production";
    trustchainId: string;
    applicationPath: string;
  };
};
type WaitInput = {
  request: Record<string, unknown>;
  authenticate: (completion: Completion) => Promise<void>;
  persist: (completion: Completion) => Promise<void>;
};

let storedProfile: Profile | undefined;
// Set only by the race test: what the locked recheck (2nd Session.read) sees instead of `storedProfile`.
let profileOnLockedRecheck: Profile | undefined | "same-as-stored";
let keychainHasEntry: boolean;
let invalidProfileIds: string[];
let addAgentIntentProfileImpl: (profile: Profile) => void;
let writeImpl: () => void;
let sessionReadCalls: number;
let deleteSecretKeySucceeds: boolean;
let saveSecretKeyError: Error | undefined;
let enrollmentUrlError: Error | undefined;
let requestInputs: Array<Record<string, unknown>>;
let hostOptions: Record<string, unknown> | undefined;
let hostClosed: boolean;
let hostWait: (input: WaitInput) => Promise<Completion>;
let waitStarted: () => void;
let authenticateOverride: ((input: Record<string, unknown>) => Promise<void>) | undefined;
let authenticateInputs: Array<Record<string, unknown>>;

const savedSecretKeys = new Set<string>();
const deletedSecretKeyCalls: string[] = [];

function makeCompletion(environment: "staging" | "production" = "production"): Completion {
  return {
    version: 2,
    agentPubkey: AGENT_PUBLIC_KEY,
    trustchainId: "app18-root",
    accountAccess: {
      mode: "direct-app16-key-reader",
      environment,
      trustchainId: "app16-root",
      applicationPath: "m/0'/16'/0'",
    },
  };
}

/** Mirrors the SDK host: a failed authenticate drops the candidate, so the wait ends in a timeout. */
async function relayDelivers(input: WaitInput, completion = makeCompletion()): Promise<Completion> {
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
  const profile =
    sessionReadCalls === 2 && profileOnLockedRecheck !== "same-as-stored"
      ? profileOnLockedRecheck
      : storedProfile;
  let staged = profile;
  return {
    getAgentIntentProfile: (_profileId: string) => profile,
    invalidAgentIntentProfileIds: invalidProfileIds,
    addAgentIntentProfile: (added: Profile) => {
      addAgentIntentProfileImpl(added);
      staged = added;
    },
    updateAgentIntentProfile: (_profileId: string, patch: Profile) => {
      staged = { ...staged, ...patch };
    },
    write: () => {
      writeImpl();
      storedProfile = staged;
    },
  };
}

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => makeSession(),
    // The real lock does mkdirSync + a real file lock — irrelevant to these checks/rollback tests.
    noopSessionLock: true,
    keychain: {
      hasAgentIntentSecretKey: (_profileId: string) => keychainHasEntry,
      saveAgentIntentSecretKey: async (profileId: string, _secretKeyHex: string) => {
        if (saveSecretKeyError) throw saveSecretKeyError;
        savedSecretKeys.add(profileId);
      },
      deleteAgentIntentSecretKey: (profileId: string) => {
        deletedSecretKeyCalls.push(profileId);
        if (deleteSecretKeySucceeds) savedSecretKeys.delete(profileId);
        return deleteSecretKeySucceeds;
      },
    },
    sdk: {
      createSoftwareAgentIdentity: () => ({
        publicKey: AGENT_PUBLIC_KEY,
        exportSecretKey: () => "deadbeef",
      }),
      createAgentEnrollmentRequest: (_identity: unknown, input: Record<string, unknown>) => {
        requestInputs.push(input);
        return { version: "2", publicKey: AGENT_PUBLIC_KEY, ...input };
      },
      createAgentEnrollmentUrl: (appUrl: string, _request: unknown) => {
        if (enrollmentUrlError) throw enrollmentUrlError;
        return `${appUrl}#request=opaque`;
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
      // A getter returning undefined falls through to the real implementation.
      get authenticateEnrollmentCompletion() {
        return authenticateOverride;
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: enrollCommand } = await import("./enroll");

type EnrollFlags = {
  profile: string;
  name: string;
  description: string;
  source: "openclaw";
  "app-url"?: string;
  "bff-url"?: string;
  "keycloak-url"?: string;
  "expires-in": string;
  environment: "staging" | "production";
  output?: "human" | "json";
};

function runEnroll(overrides: Partial<EnrollFlags> = {}) {
  const flags: EnrollFlags = {
    profile: "test-agent",
    name: "Test Agent",
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    "expires-in": "30m",
    environment: "production",
    ...overrides,
  };
  return (
    enrollCommand as unknown as { handler: (args: { flags: EnrollFlags }) => Promise<void> }
  ).handler({ flags });
}

describe("agent-intent enroll", () => {
  let restore: () => void;
  let stdout: string[];

  beforeEach(() => {
    storedProfile = undefined;
    profileOnLockedRecheck = "same-as-stored";
    sessionReadCalls = 0;
    keychainHasEntry = false;
    invalidProfileIds = [];
    deleteSecretKeySucceeds = true;
    saveSecretKeyError = undefined;
    enrollmentUrlError = undefined;
    requestInputs = [];
    hostOptions = undefined;
    hostClosed = false;
    hostWait = input => relayDelivers(input);
    waitStarted = () => {};
    authenticateInputs = [];
    authenticateOverride = input => {
      authenticateInputs.push(input);
      return Promise.resolve();
    };
    savedSecretKeys.clear();
    deletedSecretKeyCalls.length = 0;
    addAgentIntentProfileImpl = () => {};
    writeImpl = () => {};
    stdout = [];
    restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: () => {} });
  });

  afterEach(() => restore());

  describe("pre-checks and local persistence", () => {
    it("refuses to overwrite a profile id already recorded in the session", async () => {
      storedProfile = { profileId: "test-agent" };

      await expect(runEnroll()).rejects.toThrow(/already exists/);
      expect(savedSecretKeys.has("test-agent")).toBe(false);
    });

    it("refuses to enroll when a keychain entry already exists but isn't recorded in the session", async () => {
      keychainHasEntry = true;

      await expect(runEnroll()).rejects.toThrow(
        /keychain entry for profile "test-agent" already exists/,
      );
    });

    it("rejects an invalid --expires-in before touching the keychain or session", async () => {
      await expect(runEnroll({ "expires-in": "not-a-duration" })).rejects.toThrow(
        /--expires-in "not-a-duration" is invalid/,
      );
      expect(savedSecretKeys.size).toBe(0);
      expect(sessionReadCalls).toBe(0);
    });

    it("rejects an --expires-in beyond the 30 day maximum", async () => {
      await expect(runEnroll({ "expires-in": "31d" })).rejects.toThrow(/maximum is 30d/);
    });

    it("rolls back the keychain entry when the session write fails after the keychain write succeeded", async () => {
      const sessionError = new Error("disk full");
      writeImpl = () => {
        throw sessionError;
      };

      await expect(runEnroll()).rejects.toBe(sessionError);

      expect(savedSecretKeys.has("test-agent")).toBe(false);
      expect(deletedSecretKeyCalls).toEqual(["test-agent"]);
    });

    it("surfaces a combined error when the keychain rollback itself fails", async () => {
      writeImpl = () => {
        throw new Error("disk full");
      };
      deleteSecretKeySucceeds = false;

      await expect(runEnroll()).rejects.toThrow(
        /disk full.*Additionally, the keychain rollback.*failed.*remove that entry manually/s,
      );
      expect(deletedSecretKeyCalls).toEqual(["test-agent"]);
      expect(savedSecretKeys.has("test-agent")).toBe(true);
    });

    it("reports an actionable error and saves no profile when the OS keychain is unavailable", async () => {
      saveSecretKeyError = new Error("Platform secure storage failure: no Secret Service provider");
      let profileAdded = false;
      addAgentIntentProfileImpl = () => {
        profileAdded = true;
      };

      await expect(runEnroll()).rejects.toThrow(
        /Could not store the agent's secret key in the OS keychain \(Platform secure storage failure.*Secret Service provider.*Nothing was saved/s,
      );
      expect(profileAdded).toBe(false);
      expect(deletedSecretKeyCalls).toEqual([]);
    });

    it("rolls back the keychain entry when addAgentIntentProfile itself throws", async () => {
      const addError = new Error("duplicate profileId race");
      addAgentIntentProfileImpl = () => {
        throw addError;
      };

      await expect(runEnroll()).rejects.toBe(addError);

      expect(savedSecretKeys.has("test-agent")).toBe(false);
      expect(deletedSecretKeyCalls).toEqual(["test-agent"]);
    });

    it("catches a same-profile race at the locked recheck even though the precheck passed", async () => {
      profileOnLockedRecheck = { profileId: "test-agent" };

      await expect(runEnroll()).rejects.toThrow(/already exists/);
      expect(savedSecretKeys.has("test-agent")).toBe(false);
      expect(sessionReadCalls).toBe(2);
    });

    it("rejects an --app-url carrying URL credentials before it could leak into the enrollment URL", async () => {
      await expect(
        runEnroll({ "app-url": "https://user:secret@example.com/agent" }),
      ).rejects.toThrow(/--app-url must not contain URL credentials/);
      expect(savedSecretKeys.size).toBe(0);
    });

    it("rejects a non-http(s) --app-url before touching the keychain or session", async () => {
      await expect(runEnroll({ "app-url": "mailto:a@b.c" })).rejects.toThrow(
        /--app-url must be an http\(s\) URL/,
      );
      expect(savedSecretKeys.size).toBe(0);
      expect(sessionReadCalls).toBe(0);
    });

    it("rejects a --bff-url carrying URL credentials", async () => {
      await expect(runEnroll({ "bff-url": "https://user:secret@bff.example.com" })).rejects.toThrow(
        /--bff-url must not contain URL credentials/,
      );
      expect(sessionReadCalls).toBe(0);
    });

    it("rejects a non-http(s) --keycloak-url", async () => {
      await expect(runEnroll({ "keycloak-url": "ftp://keycloak.example.com" })).rejects.toThrow(
        /--keycloak-url must be an http\(s\) URL/,
      );
      expect(sessionReadCalls).toBe(0);
    });

    it("refuses a profile id that matches an invalid session record", async () => {
      invalidProfileIds = ["test-agent"];

      await expect(runEnroll()).rejects.toThrow(
        /invalid Agent Intent record for profile "test-agent"/,
      );
      expect(savedSecretKeys.size).toBe(0);
    });

    it("saves nothing and closes the relay host when building the enrollment URL fails", async () => {
      enrollmentUrlError = new TypeError("Invalid URL");

      await expect(runEnroll()).rejects.toThrow(/Invalid URL/);
      expect(savedSecretKeys.size).toBe(0);
      expect(sessionReadCalls).toBe(1);
      expect(hostClosed).toBe(true);
    });
  });

  describe("relay completion", () => {
    it("binds the signed request to a relay host on the production environment by default", async () => {
      await runEnroll();

      expect(hostOptions).toMatchObject({
        environment: "production",
        relayBaseUrl: "https://trustchain.api.live.ledger.com",
        timeouts: { candidateTimeoutMs: 30 * 60_000, completionTimeoutMs: 30 * 60_000 },
      });
      expect(requestInputs[0]).toMatchObject({
        channel: { environment: "production", hostPublicKey: HOST_PUBLIC_KEY },
      });
    });

    it("uses the staging relay and BFF when --environment staging is passed", async () => {
      await runEnroll({ environment: "staging" });

      expect(hostOptions).toMatchObject({
        relayBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      });
      expect(storedProfile).toMatchObject({
        bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
      });
    });

    it("persists the trustchain id and account access once the completion is authenticated", async () => {
      await runEnroll();

      expect(storedProfile).toMatchObject({
        profileId: "test-agent",
        environment: "production",
        bffBaseUrl: "https://global.api.prd.ledger.com/agent-intent",
        publicKey: AGENT_PUBLIC_KEY,
        trustchainId: "app18-root",
        accountAccess: {
          mode: "direct-app16-key-reader",
          environment: "production",
          trustchainId: "app16-root",
          applicationPath: "m/0'/16'/0'",
        },
      });
      expect(deletedSecretKeyCalls).toEqual([]);
      expect(hostClosed).toBe(true);
    });

    it("emits the pending enrollment before the final enrolled result in json mode", async () => {
      await runEnroll({ output: "json" });

      const lines = stdout
        .join("")
        .trim()
        .split("\n")
        .map(l => JSON.parse(l));
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({
        type: "enrollment-pending",
        profileId: "test-agent",
        enrollmentUrl: expect.stringContaining("#request=opaque"),
        fingerprint: expect.any(String),
      });
      expect(lines[1]).toMatchObject({
        status: "success",
        profileId: "test-agent",
        trustchainId: "app18-root",
        accountAccessEnvironment: "production",
        enrolled: true,
      });
    });

    it("authenticates with the --keycloak-url override and persists it on the profile", async () => {
      await runEnroll({ "keycloak-url": "https://keycloak.example.com/" });

      expect(authenticateInputs[0]).toMatchObject({
        environment: "production",
        keycloak: { baseUrl: "https://keycloak.example.com/", realm: "agent-intent-customers" },
      });
      expect(storedProfile).toMatchObject({ keycloakBaseUrl: "https://keycloak.example.com/" });
    });

    it("leaves the profile pending and persists nothing when authentication fails", async () => {
      authenticateOverride = () => Promise.reject(new Error("not a trustchain member"));

      await expect(runEnroll()).rejects.toThrow(
        /did not complete \(Enrollment completion timed out\.\).*stays pending.*fresh enrollment/s,
      );
      expect(storedProfile).toMatchObject({ profileId: "test-agent" });
      expect(storedProfile?.trustchainId).toBeUndefined();
      expect(storedProfile?.accountAccess).toBeUndefined();
      expect(hostClosed).toBe(true);
    });

    it("rejects a completion for another environment through the real completion check", async () => {
      authenticateOverride = undefined;
      hostWait = async input => {
        await expect(input.authenticate(makeCompletion("staging"))).rejects.toThrow(
          /Completion is for the staging environment.*enrolled against production/,
        );
        throw new Error("Enrollment completion timed out.");
      };

      await expect(runEnroll()).rejects.toThrow(/stays pending/);
      expect(storedProfile?.trustchainId).toBeUndefined();
    });

    it("leaves the profile pending with a fresh-enrollment hint when the relay times out", async () => {
      hostWait = () => Promise.reject(new Error("Enrollment completion timed out."));

      await expect(runEnroll()).rejects.toThrow(
        'Enrollment did not complete (Enrollment completion timed out.). Profile "test-agent" ' +
          "stays pending and cannot be resumed — start a fresh enrollment with a new --profile id.",
      );
      expect(storedProfile).toMatchObject({ profileId: "test-agent" });
      expect(storedProfile?.trustchainId).toBeUndefined();
      expect(hostClosed).toBe(true);
    });

    it("closes the relay host and leaves the profile pending on SIGINT", async () => {
      const otherListeners = process.listeners("SIGINT");
      process.removeAllListeners("SIGINT");
      try {
        const started = new Promise<void>(resolve => {
          waitStarted = resolve;
        });
        hostWait = () => new Promise<never>(() => {});

        const enrollment = runEnroll();
        await started;
        process.emit("SIGINT");

        await expect(enrollment).rejects.toThrow(/did not complete \(Enrollment interrupted\.\)/);
        expect(hostClosed).toBe(true);
        expect(storedProfile?.trustchainId).toBeUndefined();
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

      await expect(runEnroll()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile).toBeUndefined();
    });

    it("refuses to persist when the profile's public key changed while waiting for approval", async () => {
      hostWait = input => {
        storedProfile = { ...storedProfile, publicKey: "02".padEnd(66, "1") };
        return relayDelivers(input);
      };

      await expect(runEnroll()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.trustchainId).toBeUndefined();
    });

    it("refuses to persist over a profile that was already enrolled concurrently", async () => {
      hostWait = input => {
        storedProfile = { ...storedProfile, trustchainId: "other-root" };
        return relayDelivers(input);
      };

      await expect(runEnroll()).rejects.toThrow(/was removed or changed while waiting/);
      expect(storedProfile?.trustchainId).toBe("other-root");
    });

    it("reports enrolled when the completion was persisted but the relay acknowledgement failed", async () => {
      hostWait = async input => {
        await relayDelivers(input);
        throw new Error("Enrollment relay closed before completion was acknowledged.");
      };

      await runEnroll();

      expect(storedProfile).toMatchObject({ trustchainId: "app18-root" });
      expect(stdout.join("")).toContain('Agent Intent profile "test-agent" enrolled');
    });
  });
});
