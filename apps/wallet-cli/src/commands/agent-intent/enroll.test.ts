import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { createCLI, defineCommand, defineGroup } from "@bunli/core";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installOutputCapture } from "../../shared/ui";
import { KeychainUnavailableError } from "../../key-ring/keychain-unavailable-error";
import { failingKeychainProbe, overridePlatform } from "../../testing/os-keychain";
import { readLiveLockHolderPid } from "../../shared/file-lock";
import bunliConfig from "../../../bunli.config";
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
let hasSecretKeyImpl: () => boolean;
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
let keychainProbe: () => unknown;
let keyFileExists: boolean;
let deleteKeyFileSucceeds: boolean;

type FakeChild = { pid: number; kill: () => void };
let spawnedCommands: string[][];
let firstLogLine: () => Promise<Record<string, unknown>>;
let childKilled: boolean;

const savedSecretKeys = new Set<string>();
const deletedSecretKeyCalls: string[] = [];
const savedKeyFiles = new Set<string>();
const deletedKeyFileCalls: string[] = [];

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
    keychainProbe: () => keychainProbe(),
    keychain: {
      hasAgentIntentSecretKey: (_profileId: string) => hasSecretKeyImpl(),
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
    keyFile: {
      hasAgentIntentKeyFile: (_profileId: string) => keyFileExists,
      saveAgentIntentKeyFile: (profileId: string, _secretKeyHex: string) => {
        savedKeyFiles.add(profileId);
      },
      deleteAgentIntentKeyFile: (profileId: string) => {
        deletedKeyFileCalls.push(profileId);
        if (deleteKeyFileSucceeds) savedKeyFiles.delete(profileId);
        return deleteKeyFileSucceeds;
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
    detach: {
      spawnDetached: (command: string[], _logPath: string): FakeChild => {
        spawnedCommands.push(command);
        return {
          pid: 4242,
          kill: () => {
            childKilled = true;
          },
        };
      },
      readFirstLogJsonLine: (_child: FakeChild, _logPath: string) => firstLogLine(),
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

// The listener lock is a real file lock: keep it out of the real state dir.
let stateHome: string;
let savedStateHome: string | undefined;
beforeAll(() => {
  savedStateHome = process.env.XDG_STATE_HOME;
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-enroll-test-"));
  process.env.XDG_STATE_HOME = stateHome;
});
afterAll(() => {
  if (savedStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = savedStateHome;
  rmSync(stateHome, { recursive: true, force: true });
});

const { default: enrollCommand } = await import("./enroll");
const { enrollListenerPaths, withEnrollListenerLock } = await import("../../agent-intent/detach");

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
  "allow-plaintext-key": boolean;
  detach?: boolean;
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
    "allow-plaintext-key": false,
    ...overrides,
  };
  return (
    enrollCommand as unknown as { handler: (args: { flags: EnrollFlags }) => Promise<void> }
  ).handler({ flags });
}

describe("agent-intent enroll", () => {
  let restore: () => void;
  let stdout: string[];
  let stderr: string[];
  let restorePlatform: () => void;

  beforeEach(() => {
    restorePlatform = overridePlatform("linux");
    keychainProbe = () => [];
    keyFileExists = false;
    deleteKeyFileSucceeds = true;
    savedKeyFiles.clear();
    deletedKeyFileCalls.length = 0;
    storedProfile = undefined;
    profileOnLockedRecheck = "same-as-stored";
    sessionReadCalls = 0;
    hasSecretKeyImpl = () => false;
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
    spawnedCommands = [];
    firstLogLine = async () => ({});
    childKilled = false;
    stdout = [];
    stderr = [];
    restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: s => stderr.push(s) });
  });

  afterEach(() => {
    restore();
    restorePlatform();
  });

  describe("pre-checks and local persistence", () => {
    it("refuses to overwrite a profile id already recorded in the session", async () => {
      storedProfile = { profileId: "test-agent" };

      await expect(runEnroll()).rejects.toThrow(/already exists/);
      expect(savedSecretKeys.has("test-agent")).toBe(false);
    });

    it("refuses to enroll when a keychain entry already exists but isn't recorded in the session", async () => {
      hasSecretKeyImpl = () => true;

      await expect(runEnroll()).rejects.toThrow(
        /keychain entry for profile "test-agent" already exists/,
      );
    });

    it("never writes over a keychain entry it can't read, reporting keychain_unavailable", async () => {
      hasSecretKeyImpl = () => {
        throw new Error("Couldn't access platform storage: Secret Service: object locked");
      };

      const err = await runEnroll().catch((e: unknown) => e);

      expect(err).toBeInstanceOf(KeychainUnavailableError);
      expect((err as Error).message).toMatch(
        /The OS keychain can't read the entry of profile "test-agent" \(.*object locked\), so nothing was saved\. Unlock the keychain collection and re-run/,
      );
      expect(requestInputs).toEqual([]);
      expect(savedSecretKeys.size).toBe(0);
      expect(savedKeyFiles.size).toBe(0);
    });

    it("stores the key in the plaintext file with --allow-plaintext-key when the keychain entry can't be read", async () => {
      hasSecretKeyImpl = () => {
        throw new Error("Couldn't access platform storage: Secret Service: object locked");
      };

      await runEnroll({ "allow-plaintext-key": true, output: "json" });

      expect(savedKeyFiles.has("test-agent")).toBe(true);
      expect(savedSecretKeys.size).toBe(0);
      expect(storedProfile).toMatchObject({ keyStore: "plaintext-file" });
      expect(stderr.join("")).toMatch(
        /The OS keychain can't read the entry of profile "test-agent" \(.*object locked\); the agent key goes to the plaintext file .*test-agent\.key because --allow-plaintext-key was passed/,
      );
    });

    it("keeps the generic error off Linux when the keychain entry can't be read", async () => {
      overridePlatform("darwin"); // afterEach restores the real platform
      hasSecretKeyImpl = () => {
        throw new Error("User canceled the operation.");
      };

      const err = await runEnroll({ "allow-plaintext-key": true }).catch((e: unknown) => e);

      expect(err).not.toBeInstanceOf(KeychainUnavailableError);
      expect((err as Error).message).toMatch(
        /^Could not read the OS keychain entry of profile "test-agent" \(User canceled the operation\.\)\. Agent Intent needs a working OS keychain.*Nothing was saved\.$/,
      );
      expect(savedKeyFiles.size).toBe(0);
      expect(savedSecretKeys.size).toBe(0);
    });

    it("fails closed before generating a key or printing a link when no OS keychain is available", async () => {
      keychainProbe = failingKeychainProbe;

      const err = await runEnroll().catch((e: unknown) => e);

      expect(err).toBeInstanceOf(KeychainUnavailableError);
      expect((err as Error).message).toMatch(
        /No OS keychain is available.*--allow-plaintext-key only after the human explicitly agrees/s,
      );
      expect(requestInputs).toEqual([]);
      expect(savedSecretKeys.size).toBe(0);
      expect(stdout).toEqual([]);
    });

    it("reports keychain_unavailable in json mode without printing a link", async () => {
      keychainProbe = failingKeychainProbe;

      await expect(runEnroll({ output: "json" })).rejects.toThrow();

      const lines = stdout
        .join("")
        .trim()
        .split("\n")
        .map(l => JSON.parse(l));
      expect(lines).toEqual([
        {
          ok: false,
          error: {
            command: "agent-intent enroll",
            code: "keychain_unavailable",
            message: expect.stringContaining("No OS keychain is available"),
          },
        },
      ]);
      expect(savedSecretKeys.size).toBe(0);
    });

    it("probes the keychain once and only re-reads the entry inside the session lock", async () => {
      let probeCalls = 0;
      keychainProbe = () => {
        probeCalls++;
        return [];
      };
      let entryReads = 0;
      // The precheck sees no entry; a concurrent enroll writes one before the locked recheck.
      hasSecretKeyImpl = () => entryReads++ > 0;

      await expect(runEnroll()).rejects.toThrow(
        /keychain entry for profile "test-agent" already exists/,
      );
      expect(probeCalls).toBe(1);
      expect(entryReads).toBe(2);
      expect(sessionReadCalls).toBe(2);
      expect(savedSecretKeys.size).toBe(0);
      expect(stdout).toEqual([]);
    });

    it("stores the key in the OS keychain and records keyStore os-keychain when one is available", async () => {
      await runEnroll({ output: "json" });

      expect(savedSecretKeys.has("test-agent")).toBe(true);
      expect(savedKeyFiles.size).toBe(0);
      expect(storedProfile).toMatchObject({ keyStore: "os-keychain" });
      expect(JSON.parse(stdout.join("").trim().split("\n")[1])).toMatchObject({
        keyStore: "os-keychain",
      });
      expect(stderr.join("")).not.toContain("--allow-plaintext-key");
    });

    it("stores the key in a plaintext file with --allow-plaintext-key when no OS keychain is available", async () => {
      keychainProbe = failingKeychainProbe;

      await runEnroll({ "allow-plaintext-key": true, output: "json" });

      expect(savedKeyFiles.has("test-agent")).toBe(true);
      expect(savedSecretKeys.size).toBe(0);
      expect(storedProfile).toMatchObject({
        keyStore: "plaintext-file",
        trustchainId: "app18-root",
      });
      expect(JSON.parse(stdout.join("").trim().split("\n")[1])).toMatchObject({
        keyStore: "plaintext-file",
        enrolled: true,
      });
      const notices = stderr.join("").match(/goes to the plaintext file/g) ?? [];
      expect(notices).toHaveLength(1);
      expect(stderr.join("")).toMatch(
        /No OS keychain is available \(Platform failure: DBus error: .*org\.freedesktop\.secrets.*\); the agent key goes to the plaintext file .*test-agent\.key because --allow-plaintext-key was passed/,
      );
    });

    it("ignores --allow-plaintext-key with a stderr notice when the OS keychain is available", async () => {
      await runEnroll({ "allow-plaintext-key": true });

      expect(savedSecretKeys.has("test-agent")).toBe(true);
      expect(savedKeyFiles.size).toBe(0);
      expect(storedProfile).toMatchObject({ keyStore: "os-keychain" });
      expect(stderr.join("")).toContain(
        "OS keychain is available: the agent key is stored in the OS keychain and " +
          "--allow-plaintext-key was ignored.",
      );
    });

    it("refuses to enroll when an agent key file already exists but isn't recorded in the session", async () => {
      keyFileExists = true;

      await expect(runEnroll({ "allow-plaintext-key": true })).rejects.toThrow(
        /agent key file for profile "test-agent" already exists.*Remove it manually/s,
      );
      expect(savedKeyFiles.size).toBe(0);
      expect(requestInputs).toEqual([]);
    });

    it("rolls back the key file when the session write fails after the file was written", async () => {
      keychainProbe = failingKeychainProbe;
      const sessionError = new Error("disk full");
      writeImpl = () => {
        throw sessionError;
      };

      await expect(runEnroll({ "allow-plaintext-key": true })).rejects.toBe(sessionError);

      expect(deletedKeyFileCalls).toEqual(["test-agent"]);
      expect(savedKeyFiles.size).toBe(0);
      expect(deletedSecretKeyCalls).toEqual([]);
    });

    it("surfaces a combined error when the key file rollback itself fails", async () => {
      keychainProbe = failingKeychainProbe;
      writeImpl = () => {
        throw new Error("disk full");
      };
      deleteKeyFileSucceeds = false;

      await expect(runEnroll({ "allow-plaintext-key": true })).rejects.toThrow(
        /disk full.*Additionally, the key file rollback.*failed.*remove that file manually/s,
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

    it("reports keychain_unavailable with the write error when the keychain refuses the write", async () => {
      saveSecretKeyError = new Error(
        "Couldn't access platform storage: Secret Service: object locked",
      );
      let profileAdded = false;
      addAgentIntentProfileImpl = () => {
        profileAdded = true;
      };

      await expect(runEnroll({ output: "json" })).rejects.toThrow();

      const lines = stdout
        .join("")
        .trim()
        .split("\n")
        .map(l => JSON.parse(l));
      expect(lines).toEqual([
        {
          ok: false,
          error: {
            command: "agent-intent enroll",
            code: "keychain_unavailable",
            message: expect.stringMatching(
              /The OS keychain refused to store the agent key \(Couldn't access platform storage: Secret Service: object locked\).*Unlock the keychain collection and re-run.*--allow-plaintext-key only after the human explicitly agrees/s,
            ),
          },
        },
      ]);
      expect(profileAdded).toBe(false);
      expect(savedSecretKeys.size).toBe(0);
      expect(savedKeyFiles.size).toBe(0);
      expect(deletedSecretKeyCalls).toEqual([]);
      expect(deletedKeyFileCalls).toEqual([]);
    });

    it("stores the key in the plaintext file with --allow-plaintext-key when the keychain refuses the write", async () => {
      saveSecretKeyError = new Error("Couldn't access platform storage: Prompt dismissed");

      await runEnroll({ "allow-plaintext-key": true, output: "json" });

      expect(savedKeyFiles.has("test-agent")).toBe(true);
      expect(savedSecretKeys.size).toBe(0);
      expect(storedProfile).toMatchObject({ keyStore: "plaintext-file" });
      expect(JSON.parse(stdout.join("").trim().split("\n")[1])).toMatchObject({
        keyStore: "plaintext-file",
        enrolled: true,
      });
      expect(stderr.join("")).toMatch(
        /The OS keychain refused the write \(Couldn't access platform storage: Prompt dismissed\); the agent key went to the plaintext file .*test-agent\.key because --allow-plaintext-key was passed/,
      );
      expect(stderr.join("")).not.toContain("was ignored");
    });

    it("rolls back the fallback key file when the session write fails", async () => {
      saveSecretKeyError = new Error("Couldn't access platform storage: Prompt dismissed");
      const sessionError = new Error("disk full");
      writeImpl = () => {
        throw sessionError;
      };

      await expect(runEnroll({ "allow-plaintext-key": true })).rejects.toBe(sessionError);

      expect(deletedKeyFileCalls).toEqual(["test-agent"]);
      expect(savedKeyFiles.size).toBe(0);
      expect(deletedSecretKeyCalls).toEqual([]);
    });

    it("keeps the generic error and never falls back to the key file off Linux", async () => {
      overridePlatform("darwin"); // afterEach restores the real platform
      saveSecretKeyError = new Error("User canceled the operation.");

      const err = await runEnroll({ "allow-plaintext-key": true }).catch((e: unknown) => e);

      expect(err).not.toBeInstanceOf(KeychainUnavailableError);
      expect((err as Error).message).toMatch(
        /Could not store the agent's secret key in the OS keychain \(User canceled the operation\.\)/,
      );
      expect(savedKeyFiles.size).toBe(0);
      expect(savedSecretKeys.size).toBe(0);
    });

    it("reports keychain_unavailable when the Secret Service disappears before the write", async () => {
      let probeCalls = 0;
      // The precheck passes; the probe after the failed write does not.
      keychainProbe = () => {
        probeCalls++;
        if (probeCalls > 1) failingKeychainProbe();
        return [];
      };
      saveSecretKeyError = new Error("Platform secure storage failure: zbus error");
      let profileAdded = false;
      addAgentIntentProfileImpl = () => {
        profileAdded = true;
      };

      await expect(runEnroll({ output: "json" })).rejects.toThrow();

      expect(probeCalls).toBe(2);
      const lines = stdout
        .join("")
        .trim()
        .split("\n")
        .map(l => JSON.parse(l));
      expect(lines).toEqual([
        {
          ok: false,
          error: {
            command: "agent-intent enroll",
            code: "keychain_unavailable",
            message: expect.stringContaining("No OS keychain is available"),
          },
        },
      ]);
      expect(profileAdded).toBe(false);
      expect(savedSecretKeys.size).toBe(0);
      expect(savedKeyFiles.size).toBe(0);
      expect(deletedSecretKeyCalls).toEqual([]);
      expect(deletedKeyFileCalls).toEqual([]);
    });

    it("stores the key in the plaintext file with --allow-plaintext-key when the Secret Service disappears before the write", async () => {
      let probeCalls = 0;
      // The precheck passes; the probe after the failed write does not.
      keychainProbe = () => {
        probeCalls++;
        if (probeCalls > 1) failingKeychainProbe();
        return [];
      };
      saveSecretKeyError = new Error("Platform secure storage failure: zbus error");

      await runEnroll({ "allow-plaintext-key": true, output: "json" });

      expect(probeCalls).toBe(2);
      expect(savedKeyFiles.has("test-agent")).toBe(true);
      expect(savedSecretKeys.size).toBe(0);
      expect(storedProfile).toMatchObject({ keyStore: "plaintext-file" });
      expect(JSON.parse(stdout.join("").trim().split("\n")[1])).toMatchObject({
        keyStore: "plaintext-file",
        enrolled: true,
      });
      expect(stderr.join("")).toMatch(
        /No OS keychain is reachable anymore \(Platform secure storage failure: zbus error\); the agent key went to the plaintext file .*test-agent\.key because --allow-plaintext-key was passed/,
      );
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

    it("holds the profile's listener lock while waiting for approval, and releases it after", async () => {
      const { lockPath } = enrollListenerPaths("test-agent");
      let holderWhileWaiting: number | undefined;
      hostWait = input => {
        holderWhileWaiting = readLiveLockHolderPid(lockPath);
        return relayDelivers(input);
      };

      await runEnroll();

      expect(holderWhileWaiting).toBe(process.pid);
      expect(readLiveLockHolderPid(lockPath)).toBeUndefined();
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

    it("reports enrolled when SIGINT arrives while the completion is being persisted", async () => {
      const otherListeners = process.listeners("SIGINT");
      process.removeAllListeners("SIGINT");
      try {
        hostWait = async input => {
          const completion = makeCompletion();
          await input.authenticate(completion);
          const persisting = input.persist(completion);
          process.emit("SIGINT");
          await persisting;
          return new Promise<never>(() => {});
        };

        await runEnroll();

        expect(storedProfile).toMatchObject({ trustchainId: "app18-root" });
        expect(stdout.join("")).toContain('Agent Intent profile "test-agent" enrolled');
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

/** Runs `agent-intent <argv>` through the real bunli CLI, with `enroll` as the given command. */
async function runWithBunli(enroll: unknown, argv: string[]): Promise<void> {
  const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
  cli.command(
    defineGroup({
      name: "agent-intent",
      description: "test",
      commands: [enroll as Parameters<typeof defineGroup>[0]["commands"][number]],
    }),
  );
  expect((await cli.run(["agent-intent", ...argv], { noExit: true })) ?? 0).toBe(0);
}

/** The flags bunli hands enroll's handler for `argv`, parsed against enroll's own options. */
async function parseEnrollFlags(argv: string[]): Promise<Record<string, unknown>> {
  let parsed: Record<string, unknown> = {};
  const capture = defineCommand({
    name: "enroll",
    description: "test",
    options: enrollCommand.options,
    handler: async ({ flags }) => {
      parsed = { ...flags };
    },
  });
  await runWithBunli(capture, ["enroll", ...argv]);
  return parsed;
}

describe("agent-intent enroll --detach", () => {
  let restore: () => void;
  let stdout: string[];
  let stderr: string[];
  const pendingLine = {
    type: "enrollment-pending",
    command: "agent-intent enroll",
    network: "all",
    profileId: "test-agent",
    enrollmentUrl: "https://agent.example.com#request=opaque",
    fingerprint: "AB12 CD34",
    expiresAt: "2026-10-21T12:30:00.000Z",
  };

  beforeEach(() => {
    spawnedCommands = [];
    firstLogLine = async () => pendingLine;
    childKilled = false;
    storedProfile = undefined;
    profileOnLockedRecheck = "same-as-stored";
    invalidProfileIds = [];
    hasSecretKeyImpl = () => false;
    sessionReadCalls = 0;
    savedSecretKeys.clear();
    rmSync(enrollListenerPaths("test-agent").logPath, { force: true });
    stdout = [];
    stderr = [];
    restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: s => stderr.push(s) });
  });

  afterEach(() => restore());

  it("re-runs enroll in the background with the parsed flags, minus --detach and --output", async () => {
    await runEnroll({ detach: true, output: "human", "app-url": "https://agent.example.com" });

    expect(spawnedCommands).toHaveLength(1);
    const command = spawnedCommands[0];
    const args = command.slice(command.indexOf("agent-intent"));
    expect(args).toEqual([
      "agent-intent",
      "enroll",
      "--profile=test-agent",
      "--name=Test Agent",
      "--description=Remote agent that proposes intents for review.",
      "--source=openclaw",
      "--app-url=https://agent.example.com",
      "--expires-in=30m",
      "--environment=production",
      "--allow-plaintext-key=false",
      "--output=json",
    ]);
    expect(command[0]).toBe(process.execPath);
    // The parent only checks the profile id is free; the listener creates the profile.
    expect(sessionReadCalls).toBe(1);
    expect(savedSecretKeys.size).toBe(0);
  });

  it("passes every flag on so the real parser reads them back unchanged, without bunli's global flags", async () => {
    const parentArgv = [
      "enroll",
      "--detach",
      "--profile",
      "test-agent",
      "--name",
      "Test Agent",
      "--description=-dash = and spaces",
      "--source",
      "codex",
      "--expires-in",
      "2h",
      "--environment",
      "staging",
      "--keycloak-url=https://keycloak.example.com/",
      "--output",
      "json",
    ];

    await runWithBunli(enrollCommand, parentArgv);

    expect(spawnedCommands).toHaveLength(1);
    const command = spawnedCommands[0];
    const childArgv = command.slice(command.indexOf("agent-intent") + 1);
    expect(childArgv[0]).toBe("enroll");
    expect(childArgv.filter(arg => /^--(help|version|llms|detach)/.test(arg))).toEqual([]);
    expect(await parseEnrollFlags(childArgv.slice(1))).toEqual({
      ...(await parseEnrollFlags(parentArgv.slice(1))),
      detach: false,
      output: "json",
    });
  });

  it("refuses to pass on a non-scalar flag value", async () => {
    await expect(
      runEnroll({ detach: true, name: ["a", "b"] as unknown as string }),
    ).rejects.toThrow("--name has a value --detach cannot pass on to the listener.");
    expect(spawnedCommands).toEqual([]);
  });

  it("prints the listener's pending line with its pid and log path in json mode, then returns", async () => {
    await runEnroll({ detach: true, output: "json" });

    const lines = stdout
      .join("")
      .trim()
      .split("\n")
      .map(l => JSON.parse(l));
    expect(lines).toEqual([
      {
        ...pendingLine,
        listenerPid: 4242,
        logPath: enrollListenerPaths("test-agent").logPath,
      },
    ]);
  });

  it("relays what the listener wrote to stderr before its pending line", async () => {
    const warning = "⚠ No OS keychain is available (x); the key is stored in a plaintext file.\n";
    firstLogLine = async () => {
      writeFileSync(
        enrollListenerPaths("test-agent").logPath,
        warning + JSON.stringify(pendingLine) + "\nlater\n",
      );
      return pendingLine;
    };

    await runEnroll({ detach: true, output: "json" });

    expect(stderr.join("")).toBe(warning);
    expect(stdout.join("").trim().split("\n")).toHaveLength(1);
  });

  it("tells the human to run agent-intent wait instead of keeping the process running", async () => {
    await runEnroll({ detach: true });

    const text = stdout.join("");
    expect(text).toContain(pendingLine.enrollmentUrl);
    expect(text).toContain("Public key fingerprint: AB12 CD34");
    expect(text).toContain("background listener (pid 4242");
    expect(text).toContain("`wallet-cli agent-intent wait --profile test-agent`");
    expect(text).not.toContain("keep this process running");
  });

  it("keeps the code of the listener's error in its own json error envelope", async () => {
    firstLogLine = async () => ({
      ok: false,
      error: { command: "agent-intent enroll", code: "some_code", message: "boom" },
    });

    await expect(runEnroll({ detach: true, output: "json" })).rejects.toMatchObject({ code: 1 });
    expect(JSON.parse(stdout.join("").trim())).toEqual({
      ok: false,
      error: { command: "agent-intent enroll", code: "some_code", message: "boom" },
    });
  });

  it("fails with the listener's own error when it prints an error envelope", async () => {
    firstLogLine = async () => ({
      ok: false,
      error: {
        command: "agent-intent enroll",
        message: 'Agent Intent profile "x" already exists.',
      },
    });

    await expect(runEnroll({ detach: true })).rejects.toThrow(
      'Agent Intent profile "x" already exists.',
    );
  });

  it("relays the listener's stderr before failing with its error envelope", async () => {
    const warning = "⚠ No OS keychain is available (x); the key is stored in a plaintext file.\n";
    const envelope = { ok: false, error: { command: "agent-intent enroll", message: "boom" } };
    firstLogLine = async () => {
      writeFileSync(
        enrollListenerPaths("test-agent").logPath,
        warning + JSON.stringify(envelope) + "\n",
      );
      return envelope;
    };

    await expect(runEnroll({ detach: true, output: "json" })).rejects.toMatchObject({ code: 1 });
    expect(stderr.join("")).toBe(warning);
  });

  it("fails when the listener exits before printing its first event", async () => {
    firstLogLine = () =>
      Promise.reject(
        new Error("The enrollment listener exited with code 1 before printing its first event"),
      );

    await expect(runEnroll({ detach: true })).rejects.toThrow(/exited with code 1/);
  });

  it("relays the listener's stderr once when it exits before printing its first event", async () => {
    const warning = "⚠ No OS keychain is available (x); the key is stored in a plaintext file.\n";
    firstLogLine = async () => {
      writeFileSync(enrollListenerPaths("test-agent").logPath, `${warning}crashed\n`);
      throw new Error("The enrollment listener exited with code 1 before printing its first event");
    };

    await expect(runEnroll({ detach: true, output: "json" })).rejects.toMatchObject({ code: 1 });
    expect(stderr.join("")).toBe(`${warning}crashed\n`);
  });

  it("stops the listener and fails when its first line is neither pending nor an error", async () => {
    const warning = "⚠ No OS keychain is available (x); the key is stored in a plaintext file.\n";
    firstLogLine = async () => {
      writeFileSync(enrollListenerPaths("test-agent").logPath, `${warning}{"status":"success"}\n`);
      return { status: "success" };
    };

    await expect(runEnroll({ detach: true })).rejects.toThrow(/unexpected first line/);
    expect(childKilled).toBe(true);
    expect(stderr.join("")).toBe(warning);
  });

  it("refuses to start a second listener while one is running for the profile", async () => {
    await withEnrollListenerLock("test-agent", async () => {
      await expect(runEnroll({ detach: true })).rejects.toThrow(
        `An enrollment listener for profile "test-agent" is already running (pid ${process.pid}).`,
      );
    });
    expect(spawnedCommands).toEqual([]);
  });

  it("refuses a profile id already recorded in the session before the spawn truncates its log", async () => {
    storedProfile = { profileId: "test-agent" };

    await expect(runEnroll({ detach: true })).rejects.toThrow(
      'Agent Intent profile "test-agent" already exists.',
    );
    expect(spawnedCommands).toEqual([]);
  });

  it("refuses a profile id that matches an invalid session record", async () => {
    invalidProfileIds = ["test-agent"];

    await expect(runEnroll({ detach: true })).rejects.toThrow(/invalid Agent Intent record/);
    expect(spawnedCommands).toEqual([]);
  });

  it("starts a second --detach for the profile only after the first one's startup ends", async () => {
    let releaseFirst = () => {};
    firstLogLine = () =>
      new Promise(resolve => {
        releaseFirst = () => resolve(pendingLine);
      });
    const first = runEnroll({ detach: true });
    while (spawnedCommands.length === 0) await Bun.sleep(10);
    firstLogLine = async () => pendingLine;

    const second = runEnroll({ detach: true });
    await Bun.sleep(300);
    expect(spawnedCommands).toHaveLength(1);

    releaseFirst();
    await Promise.all([first, second]);
    expect(spawnedCommands).toHaveLength(2);
  });

  it("is not supported on Windows", async () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });
    try {
      await expect(runEnroll({ detach: true })).rejects.toThrow(
        /--detach is not supported on Windows/,
      );
    } finally {
      if (platform) Object.defineProperty(process, "platform", platform);
    }
    expect(spawnedCommands).toEqual([]);
  });
});

describe("agent-intent enroll --source", () => {
  const sourceSchema = (
    enrollCommand as unknown as {
      options: {
        source: { schema: { safeParse: (value: unknown) => { success: boolean; data?: unknown } } };
      };
    }
  ).options.source.schema;

  it("defaults to other when the agent doesn't declare its runtime", () => {
    expect(sourceSchema.safeParse(undefined)).toEqual({ success: true, data: "other" });
  });

  it.each(["openclaw", "hermes", "claude-code", "codex", "cursor", "muse", "grok-bot", "other"])(
    "accepts the controlled source %s",
    source => {
      expect(sourceSchema.safeParse(source).success).toBe(true);
    },
  );

  it.each(["trading", "Claude Code", "ledger-official", ""])(
    "rejects the uncontrolled source %s",
    source => {
      expect(sourceSchema.safeParse(source).success).toBe(false);
    },
  );
});
