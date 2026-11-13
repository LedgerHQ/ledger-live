import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  setSystemTime,
  spyOn,
} from "bun:test";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { YAML } from "bun";
import {
  agentEnrollmentSearch,
  buildAttestation,
  createSoftwareAgentIdentity,
  type AgentEnrollmentRequestV2,
} from "@ledgerhq/agent-intent-sdk";
import {
  _setTestSpawn,
  _setTestStartupTimeoutMs,
  enrollListenerPaths,
  withEnrollListenerLock,
  withEnrollStartLock,
} from "../../agent-intent/detach";
import { DETACHED_LISTENER_ENV } from "../../analytics/lifecycle-analytics";
import { _setTestRelayChannelHost } from "../../agent-intent/relay";
import { saveAgentIntentSecretKey } from "../../key-ring/agent-intent-keychain";
import { saveAgentIntentKeyFile } from "../../key-ring/agent-intent-key-file";
import { _setTestKeychain, type KeychainEntry } from "../../key-ring/keychain-entry";
import { _setTestAgentLedgerSyncSdk } from "../../key-ring/lkrp-sdk";
import { Session } from "../../session/session-store";
import { readLiveLockHolderPid } from "../../shared/file-lock";
import { FakeAgentIntentService } from "../../testing/agent-intent-service";
import { profileRecord } from "../../testing/agent-intent-profile-records";
import { AgentSignIn } from "../../testing/agent-sign-in";
import { runCli } from "../../testing/cli-runner";
import { FakeListenerSpawner } from "../../testing/fake-detach";
import { FakeLedgerSync } from "../../testing/fake-ledger-sync";
import { FakeRelay } from "../../testing/fake-relay";
import { InMemoryKeychain } from "../../testing/in-memory-keychain";
import { MockServer } from "../../testing/mock-server";
import { overridePlatform } from "../../testing/os-keychain";
import { writeSessionIn } from "../../testing/session-fixture";
import { withOwnSigint } from "../../testing/sigint";
import { cliStateDirIn, pointStateHomeAt, stateHomeEnv } from "../../testing/state-home";

const RELAY_CLOSED = "Enrollment relay closed before completion was acknowledged.";
const STAYS_PENDING =
  'Profile "bot" stays pending and cannot be resumed — start a fresh enrollment with a new ' +
  "--profile id.";
const NO_SECRET_SERVICE = new Error(
  "Platform failure: DBus error: The name org.freedesktop.secrets was not provided",
);
const ACCOUNT_ACCESS = {
  mode: "direct-app16-key-reader",
  environment: "production",
  trustchainId: "app16-root",
  applicationPath: "m/0'/16'/0'",
};

const service = new FakeAgentIntentService();
const signIn = new AgentSignIn(service);
const server = new MockServer(signIn.routes);
const ledgerSync = new FakeLedgerSync();
let stateHome: string;
let relay: FakeRelay;
let restorePlatform: () => void;

/**
 * The OS keychain: entries in an `InMemoryKeychain`, behind a Linux Secret Service that is `down`
 * or not; `probes` counts the availability checks. `onRead`/`onWrite` run before each entry access,
 * as another process or a slow unlock prompt would.
 */
const os = {
  keychain: new InMemoryKeychain(),
  down: false,
  probes: 0,
  onRead: undefined as ((service: string, account: string) => void) | undefined,
  onWrite: undefined as (() => void) | undefined,
  open: (service: string, account: string): KeychainEntry => {
    if (service.endsWith("-probe")) os.probes++;
    if (os.down) throw NO_SECRET_SERVICE;
    const entry = os.keychain.open(service, account);
    return {
      getPassword: () => {
        os.onRead?.(service, account);
        return entry.getPassword();
      },
      setPassword: value => {
        os.onWrite?.();
        entry.setPassword(value);
      },
      deletePassword: () => entry.deletePassword(),
    };
  },
};
let previousKeychain: ReturnType<typeof _setTestKeychain>;

beforeAll(async () => {
  server.start();
  // Loads the command under the real platform: native modules pick their build from it.
  await runCli(["agent-intent", "enroll", "--profile", "x", "--name", "x", "--expires-in", "0s"]);
});
afterAll(() => server.stop());
beforeEach(() => {
  service.reset();
  signIn.reset();
  ledgerSync.reset();
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-enroll-"));
  Object.assign(os, {
    keychain: new InMemoryKeychain(),
    down: false,
    probes: 0,
    onRead: undefined,
    onWrite: undefined,
  });
  previousKeychain = _setTestKeychain(os.open);
  relay = new FakeRelay();
  _setTestRelayChannelHost(relay.createHost);
  _setTestAgentLedgerSyncSdk(ledgerSync.createSdk);
  // The Secret Service probe only runs on Linux.
  restorePlatform = overridePlatform("linux");
});
afterEach(() => {
  restorePlatform();
  setSystemTime();
  _setTestKeychain(previousKeychain);
  _setTestRelayChannelHost(null);
  _setTestAgentLedgerSyncSdk(null);
  chmodSync(stateHome, 0o700);
  rmSync(stateHome, { recursive: true, force: true });
});

const env = () => ({ ...stateHomeEnv(stateHome), WALLET_CLI_MOCK_PORT: String(server.port) });

function enroll(...args: string[]) {
  return runCli(["agent-intent", "enroll", "--profile", "bot", "--name", "Bot", ...args], env());
}

async function enrollJson(...args: string[]) {
  const run = await enroll(...args, "--output", "json");
  return { ...run, lines: run.stdout.split("\n").map(line => JSON.parse(line)) };
}

const sessionPath = () => join(cliStateDirIn(stateHome), "session.yaml");
const keyFilePath = () => join(cliStateDirIn(stateHome), "agent-intent-keys", "bot.key");

type StoredProfile = Record<string, unknown>;

function readSession(): { agentIntentProfiles?: StoredProfile[] } | undefined {
  if (!existsSync(sessionPath())) return undefined;
  return YAML.parse(readFileSync(sessionPath(), "utf8")) as {
    agentIntentProfiles?: StoredProfile[];
  };
}

function storedProfile(): StoredProfile | undefined {
  return readSession()?.agentIntentProfiles?.find(p => p.profileId === "bot");
}

/** Another command rewrites the profile while `enroll` waits; `undefined` removes it. */
function rewriteProfile(change: (profile: StoredProfile) => StoredProfile | undefined): void {
  const session = readSession() ?? {};
  const profiles = (session.agentIntentProfiles ?? []).flatMap(p => change(p) ?? []);
  writeSessionIn(stateHome, { ...session, agentIntentProfiles: profiles });
}

/** Runs `fn` with the state dir pointed at the test's, e.g. to use the key stores directly. */
async function inStateHome<T>(fn: () => T | Promise<T>): Promise<T> {
  const restore = pointStateHomeAt(stateHome);
  try {
    return await fn();
  } finally {
    restore();
  }
}

/** The public keys of the agent keys stored in the OS keychain. */
const keychainKeys = () =>
  [...os.keychain.entries.values()].map(secret => createSoftwareAgentIdentity(secret).publicKey);

const savedKeyFile = () => (existsSync(keyFilePath()) ? readFileSync(keyFilePath(), "utf8") : null);

/** Nothing was kept: no profile, no agent key, no relay opened. */
function expectNothingSaved(): void {
  expect(storedProfile()).toBeUndefined();
  expect(os.keychain.entries.size).toBe(0);
  expect(savedKeyFile()).toBeNull();
}

const approve = (fake: FakeRelay) => fake.approve(fake.enrollmentCompletion());
const dropConnection = async (fake: FakeRelay) => fake.dropConnection();

describe("agent-intent enroll (CLI)", () => {
  it("prints the link, saves the pending profile and key, then records the human's approval", async () => {
    let whileWaiting: { profile?: StoredProfile; lockHolder?: number; lockPath?: string } = {};
    relay.onceWaiting(async fake => {
      const { lockPath } = enrollListenerPaths("bot");
      whileWaiting = {
        profile: storedProfile(),
        lockHolder: readLiveLockHolderPid(lockPath),
        lockPath,
      };
      await approve(fake);
    });

    const { lines, exitCode, stderr } = await enrollJson(
      "--description",
      "Pays invoices.",
      "--source",
      "openclaw",
    );
    await relay.settled();

    expect(exitCode, stderr).toBe(0);
    const request = relay.request as AgentEnrollmentRequestV2;
    const publicKey = request.publicKey;
    expect(lines).toEqual([
      {
        type: "enrollment-pending",
        command: "agent-intent enroll",
        network: "all",
        profileId: "bot",
        enrollmentUrl: expect.stringMatching(/^https:\/\/app\.agents\.ledger\.com\/agents\/new\?/),
        fingerprint: expect.any(String),
        expiresAt: request.expiresAt,
        keyStore: "os-keychain",
      },
      expect.objectContaining({
        status: "success",
        profileId: "bot",
        trustchainId: "app18-root",
        accountAccessEnvironment: "production",
        keyStore: "os-keychain",
        enrolled: true,
      }),
    ]);
    // The link the human opens carries the very request the CLI waits on, valid for 30 minutes.
    expect(Object.fromEntries(new URL(lines[0].enrollmentUrl).searchParams)).toEqual(
      agentEnrollmentSearch(request),
    );
    expect(request).toMatchObject({
      name: "Bot",
      description: "Pays invoices.",
      source: "openclaw",
      channel: { environment: "production" },
    });
    expect(Date.parse(request.expiresAt) - Date.now()).toBeWithin(29 * 60_000, 30 * 60_000 + 1);
    expect(relay.hostOptions).toEqual({
      environment: "production",
      relayBaseUrl: "https://trustchain.api.live.ledger.com",
      timeouts: { candidateTimeoutMs: 30 * 60_000, completionTimeoutMs: 30 * 60_000 },
    });
    // While waiting: the profile is pending and this process holds the listener lock.
    expect(whileWaiting.profile).toMatchObject({ publicKey, keyStore: "os-keychain" });
    expect(whileWaiting.profile?.trustchainId).toBeUndefined();
    expect(whileWaiting.lockHolder).toBe(process.pid);
    expect(readLiveLockHolderPid(whileWaiting.lockPath!)).toBeUndefined();
    // The approval is proven before it is saved: App-18 membership, then App-16 access.
    expect(service.signIns).toEqual([
      { publicKey, attestation: buildAttestation("app18-root"), signatureValid: true },
    ]);
    expect(ledgerSync.environments).toEqual(["production"]);
    expect(ledgerSync.restores).toEqual([
      {
        trustchain: {
          rootId: "app16-root",
          applicationPath: "m/0'/16'/0'",
          walletSyncEncryptionKey: "",
        },
        credentials: { pubkey: publicKey, privatekey: expect.any(String) },
      },
    ]);
    expect(storedProfile()).toEqual({
      profileId: "bot",
      displayName: "Bot",
      description: "Pays invoices.",
      source: "openclaw",
      environment: "production",
      bffBaseUrl: "https://global.api.prd.ledger.com/agent-intent",
      publicKey,
      keyStore: "os-keychain",
      enrollmentExpiresAt: request.expiresAt,
      createdAt: expect.any(String),
      trustchainId: "app18-root",
      accountAccess: ACCOUNT_ACCESS,
    });
    expect(keychainKeys()).toEqual([publicKey]);
    expect(savedKeyFile()).toBeNull();
    expect(relay.messages.at(-1)).toBe("host:TrustchainAddedMember");
  });

  it("tells the human what to compare and that it waits, never printing the agent key", async () => {
    relay.onceWaiting(approve);

    const { stdout, stderr, exitCode } = await enroll();
    await relay.settled();

    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("https://app.agents.ledger.com/agents/new?");
    expect(stdout).toMatch(/Public key fingerprint: \S+/);
    expect(stdout).toContain("this step never touches a Ledger device");
    expect(stdout).toMatch(
      /Profile "bot" saved as pending\. Waiting for approval until .* — keep this process running\./,
    );
    expect(stdout).toContain(
      'Agent Intent profile "bot" enrolled. Trustchain ID: app18-root (account access: production, key store: os-keychain)',
    );
    expect(stdout + stderr).not.toContain([...os.keychain.entries.values()][0]);
  });

  it.each([
    [
      "production",
      [],
      "https://trustchain.api.live.ledger.com",
      "https://app.agents.ledger.com/",
      "https://global.api.prd.ledger.com/agent-intent",
    ],
    [
      "staging",
      ["--environment", "staging"],
      "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      "https://app.agents.ledger-test.com/",
      "https://global.api.stg.ledger-test.com/agent-intent",
    ],
    [
      "overridden",
      [
        "--app-url",
        "https://agents.example.com",
        "--bff-url",
        "https://bff.example.com/agent-intent",
      ],
      "https://trustchain.api.live.ledger.com",
      "https://agents.example.com/",
      "https://bff.example.com/agent-intent",
    ],
  ] as const)(
    "uses the %s relay, frontend and BFF",
    async (_case, args, relayBaseUrl, appUrl, bffBaseUrl) => {
      relay.onceWaiting(dropConnection);

      const { lines } = await enrollJson(...args);

      expect(relay.hostOptions?.relayBaseUrl).toBe(relayBaseUrl);
      expect(lines[0].enrollmentUrl).toStartWith(appUrl);
      expect(storedProfile()?.bffBaseUrl).toBe(bffBaseUrl);
    },
  );

  it("proves membership through the --keycloak-url Keycloak and records it on the profile", async () => {
    relay.onceWaiting(approve);

    const { exitCode } = await enroll("--keycloak-url", "https://keycloak.example.com/custom/");

    expect(exitCode).toBe(0);
    expect(signIn.keycloakPaths).toEqual([
      "/custom/realms/agent-intent-customers/protocol/openid-connect/auth",
    ]);
    expect(storedProfile()).toMatchObject({
      keycloakBaseUrl: "https://keycloak.example.com/custom/",
      trustchainId: "app18-root",
    });
  });

  it.each([
    ...["openclaw", "hermes", "claude-code", "codex", "cursor", "muse", "grok-bot", "other"].map(
      s => [s, s],
    ),
    [undefined, "other"],
  ])("signs the request for the source %s", async (source, expected) => {
    relay.onceWaiting(dropConnection);

    await enrollJson(...(source ? ["--source", source] : []));

    expect(relay.request?.source as string | undefined).toBe(expected);
    expect(storedProfile()?.source).toBe(expected);
  });

  it("accepts a name and description at their maximum length", async () => {
    relay.onceWaiting(dropConnection);

    await runCli(
      [
        "agent-intent",
        "enroll",
        "--profile",
        "bot",
        "--name",
        "n".repeat(80),
        "--description",
        "d".repeat(280),
        "--output",
        "json",
      ],
      env(),
    );

    expect(relay.request).toMatchObject({ name: "n".repeat(80), description: "d".repeat(280) });
  });

  describe("an approval it can't verify leaves the profile pending", () => {
    it.each([
      [
        "for another environment",
        (): void => undefined,
        (fake: FakeRelay): string => fake.enrollmentCompletion({ environment: "staging" }),
      ],
      [
        "from an agent key outside the Trustchain",
        (): void => void (signIn.refused = true),
        undefined,
      ],
      [
        "without the App-16 controlled-test permission",
        (): void => void ledgerSync.grant("ffffffff"),
        undefined,
      ],
      [
        "for another Ledger Sync trustchain",
        (): void => void ledgerSync.restoreAs({ rootId: "other-root" }),
        undefined,
      ],
      [
        "whose Ledger Sync sign-in fails",
        (): void => void ledgerSync.failAuth(new Error("ejected")),
        undefined,
      ],
    ] as const)("refuses an approval %s", async (_case, arrange, completion) => {
      arrange();
      relay.onceWaiting(async (fake: FakeRelay): Promise<void> => {
        await expect(
          fake.approve(completion?.(fake) ?? fake.enrollmentCompletion()),
        ).rejects.toThrow("The enrollment host rejected this completion.");
        fake.dropConnection();
      });

      const { lines, exitCode } = await enrollJson();
      await relay.settled();

      expect(exitCode).toBe(1);
      expect(lines[1].error.message).toBe(
        `Enrollment did not complete (${RELAY_CLOSED}). ${STAYS_PENDING}`,
      );
      expect(storedProfile()).toMatchObject({ profileId: "bot" });
      expect(storedProfile()?.trustchainId).toBeUndefined();
      expect(storedProfile()?.accountAccess).toBeUndefined();
    });
  });

  it("leaves the profile pending when the link expires unanswered", async () => {
    const { lines, exitCode } = await enrollJson("--expires-in", "1s");

    expect(exitCode).toBe(1);
    expect(lines[1].error.message).toMatch(
      /^Enrollment did not complete \(Enrollment .*timed out.*\)\. Profile "bot" stays pending/,
    );
    expect(storedProfile()?.trustchainId).toBeUndefined();
  });

  it("leaves the profile pending when the relay drops the connection", async () => {
    relay.onceWaiting(dropConnection);

    const { lines } = await enrollJson();

    expect(lines[1].error.message).toBe(
      `Enrollment did not complete (${RELAY_CLOSED}). ${STAYS_PENDING}`,
    );
    expect(storedProfile()).toMatchObject({ profileId: "bot" });
  });

  it("stops waiting on Ctrl+C and leaves the profile pending", async () => {
    relay.onceWaiting(async () => {
      process.emit("SIGINT");
    });

    // bunli's own SIGINT handler settles the exit code, so only the output is checked.
    const { lines } = await withOwnSigint(() => enrollJson());

    expect(lines[1].error.message).toBe(
      `Enrollment did not complete (Enrollment interrupted.). ${STAYS_PENDING}`,
    );
    expect(storedProfile()?.trustchainId).toBeUndefined();
  });

  it("reports the enrollment when Ctrl+C arrives while the approval is being saved", async () => {
    const write = Session.prototype.write;
    let writes = 0;
    const spy = spyOn(Session.prototype, "write").mockImplementation(function (this: Session) {
      // The first write saves the pending profile, the second the approval.
      if (++writes === 2) process.emit("SIGINT");
      write.call(this);
    });
    relay.onceWaiting(async fake => {
      await approve(fake).catch(() => undefined);
    });

    try {
      const { lines } = await withOwnSigint(() => enrollJson());
      await relay.settled();

      expect(lines[1]).toMatchObject({ status: "success", enrolled: true });
      expect(storedProfile()).toMatchObject({ trustchainId: "app18-root" });
    } finally {
      spy.mockRestore();
    }
  });

  it.each([
    ["removed", () => undefined, (p?: StoredProfile) => expect(p).toBeUndefined()],
    [
      "given another key",
      (p: StoredProfile) => ({ ...p, publicKey: createSoftwareAgentIdentity().publicKey }),
      (p?: StoredProfile) => expect(p?.trustchainId).toBeUndefined(),
    ],
    [
      "enrolled by another run",
      (p: StoredProfile) => ({ ...p, trustchainId: "other-root" }),
      (p?: StoredProfile) => expect(p?.trustchainId).toBe("other-root"),
    ],
  ])(
    "refuses to record an approval for a profile %s while waiting",
    async (_change, rewrite, expectProfile) => {
      relay.onceWaiting(async fake => {
        rewriteProfile(rewrite);
        await expect(approve(fake)).rejects.toThrow(RELAY_CLOSED);
      });

      const { lines, exitCode } = await enrollJson();
      await relay.settled();

      expect(exitCode).toBe(1);
      expect(lines[1].error.message).toMatch(
        /was removed or changed while waiting for approval; refusing to record the completion/,
      );
      expectProfile(storedProfile());
    },
  );

  it("reports the enrollment once it is saved, even when the relay lost the acknowledgement", async () => {
    relay.dropOnHostMessage = "TrustchainAddedMember";
    relay.onceWaiting(async fake => {
      await expect(approve(fake)).rejects.toThrow(RELAY_CLOSED);
    });

    const { stdout, exitCode } = await enroll();
    await relay.settled();

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Agent Intent profile "bot" enrolled');
    expect(storedProfile()).toMatchObject({ trustchainId: "app18-root" });
  });

  it.each([
    [
      "an invalid --expires-in",
      ["--expires-in", "not-a-duration"],
      '--expires-in "not-a-duration" is invalid; use e.g. 45s, 30m, 2h, or 1d.',
    ],
    [
      "an --expires-in over 30 days",
      ["--expires-in", "31d"],
      '--expires-in "31d" is too long; the maximum is 30d.',
    ],
    [
      "an --app-url with credentials",
      ["--app-url", "https://user:secret@example.com/agent"],
      /^--app-url must not contain URL credentials/,
    ],
    ["a non-http --app-url", ["--app-url", "mailto:a@b.c"], "--app-url must be an http(s) URL."],
    [
      "a --bff-url with credentials",
      ["--bff-url", "https://user:secret@bff.example.com"],
      /^--bff-url must not contain URL credentials/,
    ],
    [
      "a non-http --keycloak-url",
      ["--keycloak-url", "ftp://keycloak.example.com"],
      "--keycloak-url must be an http(s) URL.",
    ],
  ])("rejects %s before touching the keychain or the session", async (_case, args, message) => {
    const { lines, exitCode } = await enrollJson(...args);

    expect(exitCode).toBe(1);
    expect(lines[0].error.message).toMatch(message);
    expect(os.probes).toBe(0);
    expect(existsSync(sessionPath())).toBe(false);
    expect(relay.request).toBeUndefined();
  });

  // bunli reports these itself, outside the output runCli captures.
  it.each([
    ["an uncontrolled --source", ["--source", "trading"]],
    ["a --source with a space", ["--source", "Claude Code"]],
    ["an empty --source", ["--source", ""]],
    ["a --name over 80 characters", ["--name", "n".repeat(81)]],
    ["a --description over 280 characters", ["--description", "d".repeat(281)]],
    ["a blank --name", ["--name", " \t\n"]],
    ["a blank --description", ["--description", ""]],
  ])("refuses %s as an invalid option", async (_case, args) => {
    const { exitCode } = await enroll(...args, "--output", "json");

    expect(exitCode).toBe(1);
    expect(os.probes).toBe(0);
    expect(existsSync(sessionPath())).toBe(false);
  });

  it.each([
    [
      "a profile of that id",
      () => writeSessionIn(stateHome, { agentIntentProfiles: [profileRecord("bot")] }),
      /Agent Intent profile "bot" already exists\. Choose a different --profile id, or run `wallet-cli agent-intent show --profile bot`\./,
    ],
    [
      "an invalid record of that id",
      () =>
        writeSessionIn(stateHome, {
          agentIntentProfiles: [profileRecord("bot", { environment: "moon" })],
        }),
      /session\.yaml has an invalid Agent Intent record for profile "bot"/,
    ],
    [
      "an unrecorded keychain entry",
      () => inStateHome(() => saveAgentIntentSecretKey("bot", "11".repeat(32))),
      /A keychain entry for profile "bot" already exists but is not recorded in the session\. Remove it manually/,
    ],
    [
      "an unrecorded key file",
      () => inStateHome(() => saveAgentIntentKeyFile("bot", "11".repeat(32))),
      /An agent key file for profile "bot" already exists \(.*bot\.key\) but is not recorded in the session\. Remove it manually/,
    ],
  ])("refuses to enroll over %s", async (_case, arrange, message) => {
    await arrange();
    const keysBefore = [...os.keychain.entries.values()];
    const keyFileBefore = savedKeyFile();

    const { lines, exitCode } = await enrollJson("--allow-plaintext-key");

    expect(exitCode).toBe(1);
    expect(lines).toHaveLength(1);
    expect(lines[0].error.message).toMatch(message);
    expect([...os.keychain.entries.values()]).toEqual(keysBefore);
    expect(savedKeyFile()).toBe(keyFileBefore);
    expect(relay.request).toBeUndefined();
  });

  it.each([
    [
      "records the same profile",
      () => writeSessionIn(stateHome, { agentIntentProfiles: [profileRecord("bot")] }),
      /Agent Intent profile "bot" already exists/,
    ],
    [
      "stores a key for the same profile",
      (service: string, account: string) =>
        os.keychain.entries.set(`${service}:${account}`, "22".repeat(32)),
      /A keychain entry for profile "bot" already exists/,
    ],
  ] as const)(
    "catches a concurrent enroll that %s after the first check, probing the keychain once",
    async (_case, concurrentEnroll, message) => {
      os.onRead = (service, account) => {
        os.onRead = undefined;
        concurrentEnroll(service, account);
      };

      const { lines, exitCode } = await enrollJson();

      expect(exitCode).toBe(1);
      expect(lines).toHaveLength(1);
      expect(lines[0].error.message).toMatch(message);
      expect(os.probes).toBe(1);
      expect(relay.request).toBeUndefined();
    },
  );

  describe("where the agent key goes", () => {
    const unreadable = new Error("Couldn't access platform storage: Secret Service: object locked");
    const refused = new Error("Couldn't access platform storage: Prompt dismissed");

    it.each([
      [
        "no Secret Service",
        () => (os.down = true),
        /^No OS keychain is available: no Secret Service provider .*org\.freedesktop\.secrets.*Agent Intent stores the agent key in the OS keychain, so nothing was saved\. Re-run with --allow-plaintext-key only after the human explicitly agrees/,
      ],
      [
        "an entry it can't read",
        () => (os.keychain.readError = unreadable),
        /^The OS keychain can't read the entry of profile "bot" \(.*object locked\), so nothing was saved\. Unlock the keychain collection and re-run, or re-run with --allow-plaintext-key/,
      ],
      [
        "a keychain refusing the write",
        () => (os.keychain.writeError = refused),
        /^The OS keychain refused to store the agent key \(.*Prompt dismissed\), so nothing was saved\. Unlock the keychain collection and re-run/,
      ],
      [
        "a Secret Service gone before the write",
        () => {
          os.keychain.writeError = new Error("Platform secure storage failure: zbus error");
          os.onWrite = () => (os.down = true);
        },
        /^No OS keychain is available/,
      ],
    ])(
      "reports keychain_unavailable on Linux with %s, saving nothing",
      async (_case, arrange, message) => {
        arrange();

        const { lines, exitCode, stdout } = await enrollJson();

        expect(exitCode).toBe(1);
        expect(lines).toEqual([
          {
            ok: false,
            error: {
              command: "agent-intent enroll",
              code: "keychain_unavailable",
              message: expect.stringMatching(message),
            },
          },
        ]);
        expect(stdout).not.toContain("agents/new");
        expectNothingSaved();
      },
    );

    it.each([
      [
        "no Secret Service",
        () => (os.down = true),
        /No OS keychain is available \(.*org\.freedesktop\.secrets.*\); the agent key goes to the plaintext file .*bot\.key because --allow-plaintext-key was passed/,
      ],
      [
        "an entry it can't read",
        () => (os.keychain.readError = unreadable),
        /The OS keychain can't read the entry of profile "bot" \(.*object locked\); the agent key goes to the plaintext file .*bot\.key because --allow-plaintext-key was passed/,
      ],
      [
        "a keychain refusing the write",
        () => (os.keychain.writeError = refused),
        /The OS keychain refused the write \(.*Prompt dismissed\); the agent key went to the plaintext file .*bot\.key because --allow-plaintext-key was passed/,
      ],
      [
        "a Secret Service gone before the write",
        () => {
          os.keychain.writeError = new Error("Platform secure storage failure: zbus error");
          os.onWrite = () => (os.down = true);
        },
        /No OS keychain is reachable anymore \(Platform secure storage failure: zbus error\); the agent key went to the plaintext file .*bot\.key because --allow-plaintext-key was passed/,
      ],
    ])(
      "stores the key in a 0600 file with --allow-plaintext-key and %s",
      async (_case, arrange, notice) => {
        arrange();
        relay.onceWaiting(approve);

        const { lines, exitCode, stderr } = await enrollJson("--allow-plaintext-key");
        await relay.settled();

        expect(exitCode, stderr).toBe(0);
        expect(lines.map(l => l.keyStore)).toEqual(["plaintext-file", "plaintext-file"]);
        expect(stderr).toMatch(notice);
        expect(stderr.match(/plaintext file/g)).toHaveLength(1);
        expect(stderr).not.toContain("was ignored");
        expect(storedProfile()).toMatchObject({
          keyStore: "plaintext-file",
          trustchainId: "app18-root",
        });
        expect(createSoftwareAgentIdentity(savedKeyFile()!).publicKey).toBe(
          String(storedProfile()?.publicKey),
        );
        expect(statSync(keyFilePath()).mode & 0o777).toBe(0o600);
        expect(os.keychain.entries.size).toBe(0);
      },
    );

    it("ignores --allow-plaintext-key, saying so, when the OS keychain takes the key", async () => {
      relay.onceWaiting(dropConnection);

      const { lines, stderr } = await enrollJson("--allow-plaintext-key");

      expect(lines[0].keyStore).toBe("os-keychain");
      expect(stderr).toContain(
        "OS keychain is available: the agent key is stored in the OS keychain and --allow-plaintext-key was ignored.",
      );
      expect(keychainKeys()).toEqual([String(storedProfile()?.publicKey)]);
      expect(savedKeyFile()).toBeNull();
    });

    it.each([
      [
        "an entry it can't read",
        () => (os.keychain.readError = new Error("User canceled the operation.")),
        /^Could not read the OS keychain entry of profile "bot" \(User canceled the operation\.\)\. Agent Intent needs a working OS keychain.*Nothing was saved\.$/,
      ],
      [
        "a keychain refusing the write",
        () => (os.keychain.writeError = new Error("User canceled the operation.")),
        /^Could not store the agent's secret key in the OS keychain \(User canceled the operation\.\)\. Agent Intent needs a working OS keychain/,
      ],
    ])("never falls back to a key file off Linux, with %s", async (_case, arrange, message) => {
      overridePlatform("darwin"); // afterEach restores the real platform
      arrange();

      const { lines, exitCode } = await enrollJson("--allow-plaintext-key");

      expect(exitCode).toBe(1);
      expect(lines[0].error.code).toBeUndefined();
      expect(lines[0].error.message).toMatch(message);
      expectNothingSaved();
    });
  });

  describe("when the pending profile can't be saved", () => {
    let writeSpy: ReturnType<typeof spyOn> | undefined;
    afterEach(() => {
      writeSpy?.mockRestore();
      writeSpy = undefined;
    });

    function failSessionWrite(before?: () => void): void {
      writeSpy = spyOn(Session.prototype, "write").mockImplementationOnce(() => {
        before?.();
        throw new Error("disk full");
      });
    }

    it.each([
      ["from the OS keychain", () => undefined],
      ["from the key file", () => (os.down = true)],
      [
        "from the key file it fell back to",
        () => (os.keychain.writeError = new Error("Prompt dismissed")),
      ],
    ])("removes the agent key %s", async (_case, arrange) => {
      arrange();
      failSessionWrite();

      const { lines, exitCode } = await enrollJson("--allow-plaintext-key");

      expect(exitCode).toBe(1);
      expect(lines).toEqual([
        { ok: false, error: { command: "agent-intent enroll", message: "disk full" } },
      ]);
      expectNothingSaved();
      expect(relay.request).toBeUndefined();
    });

    it("says to remove the keychain entry by hand when it can't", async () => {
      os.keychain.deleteError = new Error("locked");
      failSessionWrite();

      const { lines } = await enrollJson();

      expect(lines[0].error.message).toMatch(
        /^disk full Additionally, the keychain rollback for profile "bot" failed — remove that entry manually before retrying/,
      );
      expect(os.keychain.entries.size).toBe(1);
    });

    it("says to remove the key file by hand when it can't", async () => {
      os.down = true;
      failSessionWrite(() => chmodSync(dirname(keyFilePath()), 0o500));

      try {
        const { lines } = await enrollJson("--allow-plaintext-key");

        expect(lines[0].error.message).toMatch(
          /^disk full Additionally, the key file rollback for profile "bot" failed — remove that file manually before retrying/,
        );
      } finally {
        chmodSync(dirname(keyFilePath()), 0o700);
      }
      expect(savedKeyFile()).not.toBeNull();
    });
  });

  describe("when the OS keychain takes long to store the key", () => {
    /** The keychain write returns `ms` later, e.g. after an unlock prompt. */
    const slowWrite = (ms: number) => {
      os.onWrite = () => setSystemTime(new Date(Date.now() + ms));
    };

    it.each([
      [
        "near the stuck limit of `wait`",
        9 * 60_000 + 1_000,
        [],
        "listener_stuck",
        /^Saving the agent key took over 9 minutes .*the key was removed and nothing was saved\./,
      ],
      [
        "past the link's expiry",
        60_000,
        ["--expires-in", "45s"],
        "enrollment_expired",
        /^The enrollment link expired while the OS keychain was storing the agent key .*the key was removed and nothing was saved\./,
      ],
    ] as const)("drops the key it saved %s", async (_case, ms, args, code, message) => {
      slowWrite(ms);

      const { lines, exitCode } = await enrollJson(...args);

      expect(exitCode).toBe(1);
      expect(lines).toEqual([
        {
          ok: false,
          error: { command: "agent-intent enroll", code, message: expect.stringMatching(message) },
        },
      ]);
      expectNothingSaved();
    });

    it("keeps a key saved just within the margin", async () => {
      slowWrite(9 * 60_000 - 1_000);
      relay.onceWaiting(dropConnection);

      const { lines } = await enrollJson();

      expect(lines[0].type).toBe("enrollment-pending");
      expect(keychainKeys()).toEqual([String(storedProfile()?.publicKey)]);
    });
  });
});

describe("agent-intent enroll --detach (CLI)", () => {
  const spawner = new FakeListenerSpawner();
  const logPath = () => {
    const restore = pointStateHomeAt(stateHome);
    try {
      return enrollListenerPaths("bot").logPath;
    } finally {
      restore();
    }
  };
  const pendingLine = {
    type: "enrollment-pending",
    command: "agent-intent enroll",
    network: "all",
    profileId: "bot",
    enrollmentUrl: "https://agent.example.com/agents/new?v=2",
    fingerprint: "AB12 CD34",
    expiresAt: "2026-10-21T12:30:00.000Z",
    keyStore: "plaintext-file",
  };
  const warning = "⚠ No OS keychain is available (x); the agent key goes to the plaintext file.";

  beforeEach(() => {
    spawner.started.length = 0;
    spawner.lines = [pendingLine];
    spawner.exitCode = undefined;
    _setTestSpawn(spawner.spawn);
  });
  afterEach(() => {
    _setTestSpawn(null);
    _setTestStartupTimeoutMs(null);
  });

  /** The listener's argv after the CLI's own entry point. */
  const listenerArgs = () => {
    const { command } = spawner.started[0];
    return command.slice(command.indexOf("agent-intent"));
  };

  /** Holds a lock another `enroll` takes, as a concurrent run would; returns its release. */
  async function holdLock(take: (fn: () => Promise<void>) => Promise<void>) {
    let release!: () => void;
    const held = new Promise<void>(resolve => (release = resolve));
    const restore = pointStateHomeAt(stateHome);
    let locked: Promise<void>;
    try {
      locked = take(() => held);
    } finally {
      restore();
    }
    return () => {
      release();
      return locked;
    };
  }

  it("starts a background listener with the flags not at their default, then prints its pending line", async () => {
    const { lines, exitCode, stderr } = await enrollJson(
      "--detach",
      "--app-url",
      "https://agent.example.com",
      "--source",
      "openclaw",
    );

    expect(exitCode, stderr).toBe(0);
    expect(spawner.started).toHaveLength(1);
    expect(spawner.started[0].command[0]).toBe(process.execPath);
    expect(spawner.started[0].env?.[DETACHED_LISTENER_ENV]).toBe("1");
    expect(listenerArgs()).toEqual([
      "agent-intent",
      "enroll",
      "--profile=bot",
      "--name=Bot",
      "--source=openclaw",
      "--app-url=https://agent.example.com",
      "--output=json",
    ]);
    expect(lines).toEqual([{ ...pendingLine, listenerPid: 4242, logPath: logPath() }]);
    // The listener, not this run, creates the profile and its key.
    expect(os.probes).toBe(0);
    expectNothingSaved();
  });

  it("hands every flag to a listener that enrolls with exactly those flags", async () => {
    await enrollJson(
      "--detach",
      "--description=-dash = and spaces",
      "--source",
      "codex",
      "--expires-in",
      "2h",
      "--environment",
      "staging",
      "--keycloak-url=https://keycloak.example.com/",
      "--allow-plaintext-key",
    );
    const args = listenerArgs();
    expect(args.filter(arg => /^--(help|version|llms|detach)/.test(arg))).toEqual([]);
    expect(args).not.toContain("--allow-plaintext-key=false");

    relay.onceWaiting(dropConnection);
    const listener = await runCli(args, env());

    expect(storedProfile()).toMatchObject({
      displayName: "Bot",
      description: "-dash = and spaces",
      source: "codex",
      environment: "staging",
      keycloakBaseUrl: "https://keycloak.example.com/",
    });
    expect(Date.parse(String(storedProfile()?.enrollmentExpiresAt)) - Date.now()).toBeWithin(
      119 * 60_000,
      120 * 60_000 + 1,
    );
    expect(listener.stderr).toContain("--allow-plaintext-key was ignored");
  });

  it("tells the human to check on the listener with agent-intent wait", async () => {
    const { stdout } = await enroll("--detach");

    expect(stdout).toContain(pendingLine.enrollmentUrl);
    expect(stdout).toContain("Public key fingerprint: AB12 CD34");
    expect(stdout).toContain(`A background listener (pid 4242, log ${logPath()})`);
    expect(stdout).toContain(
      "Run `wallet-cli agent-intent wait --profile bot` to check whether the enrollment completed.",
    );
    expect(stdout).not.toContain("keep this process running");
  });

  it("hands a listener still starting at the startup timeout over to wait, without stopping it", async () => {
    spawner.lines = [];
    _setTestStartupTimeoutMs(50);

    const { lines } = await enrollJson("--detach");
    const { stdout } = await enroll("--detach");

    expect(lines).toEqual([
      {
        type: "enrollment-waiting",
        command: "agent-intent enroll",
        network: "all",
        profileId: "bot",
        listenerPid: 4242,
        logPath: logPath(),
      },
    ]);
    expect(stdout).toContain('Profile "bot" is not saved yet');
    expect(stdout).toContain("OS keychain unlock prompt");
    expect(stdout).toContain("`wallet-cli agent-intent wait --profile bot` to check on it");
    expect(spawner.started.map(child => child.killedWith)).toEqual([undefined, undefined]);
  });

  it.each([
    ["with its code", { code: "some_code", message: "boom" }],
    ["without a code", { message: 'Agent Intent profile "x" already exists.' }],
  ])("fails with the listener's own error %s", async (_case, error) => {
    spawner.lines = [{ ok: false, error: { command: "agent-intent enroll", ...error } }];

    const { lines, exitCode } = await enrollJson("--detach");

    expect(exitCode).toBe(1);
    expect(lines).toEqual([{ ok: false, error: { command: "agent-intent enroll", ...error } }]);
  });

  it.each([
    ["before its pending line", [warning, pendingLine, "later"], undefined, 0, undefined, warning],
    [
      "before its error",
      [warning, { ok: false, error: { message: "boom" } }],
      undefined,
      1,
      /^boom$/,
      warning,
    ],
    [
      "when it exits before its first line",
      [warning, "crashed"],
      1,
      1,
      /exited with code 1/,
      `${warning}\ncrashed`,
    ],
    [
      "before an unexpected first line, stopping it",
      [warning, { status: "success" }],
      undefined,
      1,
      /printed an unexpected first line and was stopped/,
      warning,
    ],
  ] as const)(
    "relays what the listener wrote to stderr %s",
    async (_case, logged, listenerExit, exitCode, message, relayed) => {
      spawner.lines = [...logged];
      spawner.exitCode = listenerExit;

      const run = await enrollJson("--detach");

      expect(run.exitCode).toBe(exitCode);
      expect(run.stderr).toBe(relayed);
      if (message) expect(run.lines[0].error.message).toMatch(message);
      else expect(run.lines).toHaveLength(1);
      expect(spawner.started[0].killedWith).toBe(
        _case.includes("stopping") ? "SIGTERM" : undefined,
      );
    },
  );

  it.each([
    ["a profile of that id", profileRecord("bot"), 'Agent Intent profile "bot" already exists.'],
    [
      "an invalid record of that id",
      profileRecord("bot", { environment: "moon" }),
      /invalid Agent Intent record/,
    ],
  ])("refuses %s before the listener truncates its log", async (_case, record, message) => {
    writeSessionIn(stateHome, { agentIntentProfiles: [record] });

    const { lines } = await enrollJson("--detach");

    expect(lines[0].error.message).toMatch(message);
    expect(spawner.started).toEqual([]);
  });

  it("refuses to start a second listener while one runs for the profile", async () => {
    const release = await holdLock(fn => withEnrollListenerLock("bot", fn));
    try {
      const { lines } = await enrollJson("--detach");

      expect(lines[0].error.message).toBe(
        `An enrollment listener for profile "bot" is already running (pid ${process.pid}). ` +
          "Run `wallet-cli agent-intent wait --profile bot` to check on it.",
      );
    } finally {
      await release();
    }
    expect(spawner.started).toEqual([]);
  });

  it("starts its listener only once another --detach for the profile has finished starting", async () => {
    const release = await holdLock(fn => withEnrollStartLock("bot", fn));

    const run = enrollJson("--detach");
    await Bun.sleep(300);
    expect(spawner.started).toEqual([]);
    await release();

    expect((await run).lines[0].type).toBe("enrollment-pending");
    expect(spawner.started).toHaveLength(1);
  });

  it("starts the listener on Windows too", async () => {
    overridePlatform("win32"); // afterEach restores the real platform

    const { lines } = await enrollJson("--detach");

    expect(spawner.started).toHaveLength(1);
    expect(lines[0]).toMatchObject({ type: "enrollment-pending", listenerPid: 4242 });
  });
});
