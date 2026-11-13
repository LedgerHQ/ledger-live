import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { YAML } from "bun";
import {
  agentRecoverySearch,
  buildAttestation,
  createSoftwareAgentIdentity,
  type AgentRecoveryRequest,
} from "@ledgerhq/agent-intent-sdk";
import { _setTestRelayChannelHost } from "../../agent-intent/relay";
import {
  FakeAgentIntentService,
  makeEnrolledProfile,
  type EnrolledProfile,
  type EnrolledProfileOptions,
} from "../../testing/agent-intent-service";
import { AgentSignIn } from "../../testing/agent-sign-in";
import { runCli } from "../../testing/cli-runner";
import { FakeRelay } from "../../testing/fake-relay";
import { MockServer } from "../../testing/mock-server";
import { overridePlatform } from "../../testing/os-keychain";
import { withOwnSigint } from "../../testing/sigint";
import { cliStateDirIn } from "../../testing/state-home";

const ACCOUNT_ACCESS = {
  mode: "direct-app16-key-reader",
  environment: "staging",
  trustchainId: "app16-root",
  applicationPath: "m/0'/16'/0'",
};
const RELAY_CLOSED = "Enrollment relay closed before completion was acknowledged.";

const service = new FakeAgentIntentService();
const signIn = new AgentSignIn(service);
const server = new MockServer(signIn.routes);
let fixture: EnrolledProfile | undefined;
let relay: FakeRelay;

beforeAll(async () => {
  server.start();
  // Loads the command under the real platform: native modules pick their build from it.
  await runCli(["agent-intent", "recover", "--profile", "x", "--expires-in", "0s"]);
});
afterAll(() => server.stop());
beforeEach(async () => {
  service.reset();
  signIn.reset();
  relay = new FakeRelay();
  _setTestRelayChannelHost(relay.createHost);
  await useProfile();
});
afterEach(() => {
  _setTestRelayChannelHost(null);
  fixture?.cleanup();
  fixture = undefined;
});

/** Replaces the test's enrolled profile `bot`, staging by default, with its key in the keychain. */
async function useProfile({ profile, ...options }: EnrolledProfileOptions = {}) {
  fixture?.cleanup();
  fixture = await makeEnrolledProfile({
    ...options,
    profile: { source: "openclaw", accountAccess: ACCOUNT_ACCESS, ...profile },
  });
  return fixture;
}

function enrolled(): EnrolledProfile {
  if (!fixture) throw new Error("No enrolled profile");
  return fixture;
}

function recover(...args: string[]) {
  return runCli(["agent-intent", "recover", "--profile", "bot", ...args], {
    ...enrolled().env,
    WALLET_CLI_MOCK_PORT: String(server.port),
  });
}

async function recoverJson(...args: string[]) {
  const run = await recover(...args, "--output", "json");
  return { ...run, lines: run.stdout.split("\n").map(line => JSON.parse(line)) };
}

type StoredProfile = Record<string, unknown> & { pendingRecovery?: Record<string, unknown> };

function readSession(): { agentIntentProfiles: StoredProfile[] } {
  return YAML.parse(readFileSync(enrolled().sessionPath, "utf8")) as {
    agentIntentProfiles: StoredProfile[];
  };
}

function storedProfile(): StoredProfile | undefined {
  return readSession().agentIntentProfiles.find(p => p.profileId === "bot");
}

/** Another command rewrites the profile while `recover` waits; `undefined` removes it. */
function rewriteProfile(change: (profile: StoredProfile) => StoredProfile | undefined): void {
  const session = readSession();
  const profiles = session.agentIntentProfiles.flatMap(p => change(p) ?? []);
  writeFileSync(
    enrolled().sessionPath,
    YAML.stringify({ ...session, agentIntentProfiles: profiles }),
  );
}

const approve = (fake: FakeRelay) => fake.approve(fake.recoveryCompletion());

describe("agent-intent recover (CLI)", () => {
  it("re-enrolls the profile's key into its previous Trustchain once the human approves", async () => {
    let pendingWhileWaiting: unknown;
    relay.onceWaiting(async fake => {
      pendingWhileWaiting = storedProfile()?.pendingRecovery;
      await approve(fake);
    });

    const { lines, exitCode, stderr } = await recoverJson();
    await relay.settled();

    expect(exitCode, stderr).toBe(0);
    const request = relay.request as AgentRecoveryRequest;
    expect(request).toMatchObject({
      publicKey: enrolled().agent.publicKey,
      name: "Bot",
      description: "Remote agent that proposes intents for review.",
      source: "openclaw",
      previousTrustchainId: "tc-1",
    });
    expect(lines).toEqual([
      {
        type: "recovery-pending",
        command: "agent-intent recover",
        network: "all",
        profileId: "bot",
        recoveryUrl: expect.stringMatching(/^https:\/\/app\.agents\.ledger-test\.com\//),
        fingerprint: expect.any(String),
        expiresAt: request.expiresAt,
      },
      expect.objectContaining({
        status: "success",
        profileId: "bot",
        trustchainId: "tc-1",
        recovered: true,
      }),
    ]);
    // The link the human opens carries the very request the CLI waits on.
    const linkParams = Object.fromEntries(new URL(lines[0].recoveryUrl).searchParams);
    expect(linkParams).toEqual(agentRecoverySearch(request));
    expect(pendingWhileWaiting).toEqual({
      previousTrustchainId: "tc-1",
      requestSignature: request.signature,
      expiresAt: request.expiresAt,
    });
    expect(relay.hostOptions).toEqual({
      environment: "staging",
      relayBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      timeouts: { candidateTimeoutMs: 30 * 60_000, completionTimeoutMs: 30 * 60_000 },
    });
    expect(relay.messages).toContain("user:TrustchainShareCredential");
    expect(relay.messages.at(-1)).toBe("host:TrustchainAddedMember");
    // Membership is proven with the profile's own key, for the recovered Trustchain.
    expect(service.signIns).toEqual([
      {
        publicKey: enrolled().agent.publicKey,
        attestation: buildAttestation("tc-1"),
        signatureValid: true,
      },
    ]);
    expect(storedProfile()).toMatchObject({
      publicKey: enrolled().agent.publicKey,
      trustchainId: "tc-1",
      accountAccess: ACCOUNT_ACCESS,
    });
    expect(storedProfile()?.pendingRecovery).toBeUndefined();
  });

  it.each([
    ["os-keychain", undefined],
    [
      "plaintext-file",
      /Profile "bot" stores its agent key unencrypted in .*agent-intent-keys[/\\]bot\.key/,
    ],
  ] as const)(
    "reads a %s key and tells the human what to compare, never printing the key",
    async (keyStore, warning) => {
      await useProfile({ keyStore });
      relay.onceWaiting(approve);

      const { stdout, stderr, exitCode } = await recover();
      await relay.settled();

      expect(exitCode, stderr).toBe(0);
      expect(stdout).toContain("https://app.agents.ledger-test.com/");
      expect(stdout).toMatch(/Public key fingerprint: \S+/);
      expect(stdout).toContain("keeps its existing key and Ledger Sync access while recovering");
      expect(stdout).toContain(
        'Agent Intent profile "bot" recovered. Trustchain ID: tc-1 (existing Ledger Sync access preserved)',
      );
      if (warning) expect(stderr).toMatch(warning);
      else expect(stderr).not.toContain("unencrypted");
      expect(stdout + stderr).not.toContain(enrolled().agent.exportSecretKey());
    },
  );

  it.each(["hermes", "claude-code", "codex", "other"])(
    "signs the recovery of a %s profile with its source",
    async source => {
      await useProfile({ profile: { source } });
      relay.onceWaiting(async fake => fake.dropConnection());

      await recoverJson();

      expect(relay.request).toMatchObject({ source, previousTrustchainId: "tc-1" });
    },
  );

  it.each([
    [
      "staging",
      [],
      "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      "https://app.agents.ledger-test.com/",
    ],
    ["production", [], "https://trustchain.api.live.ledger.com", "https://app.agents.ledger.com/"],
    [
      "production",
      ["--app-url", "https://agents.example.com"],
      "https://trustchain.api.live.ledger.com",
      "https://agents.example.com/",
    ],
  ] as const)(
    "waits on the %s relay with the link at its frontend (%j)",
    async (environment, args, relayBaseUrl, appUrl) => {
      await useProfile({ profile: { environment } });
      relay.onceWaiting(async fake => fake.dropConnection());

      const { lines } = await recoverJson(...args);

      expect(relay.hostOptions).toMatchObject({ environment, relayBaseUrl });
      expect(lines[0].recoveryUrl).toStartWith(appUrl);
    },
  );

  it("proves membership through the profile's own Keycloak", async () => {
    await useProfile({ profile: { keycloakBaseUrl: "https://keycloak.example.com/custom/" } });
    relay.onceWaiting(approve);

    const { exitCode } = await recover();

    expect(exitCode).toBe(0);
    expect(signIn.keycloakPaths).toEqual([
      "/custom/realms/agent-intent-customers/protocol/openid-connect/auth",
    ]);
  });

  it("refuses an approval whose agent is not back in the Trustchain, and keeps the previous enrollment", async () => {
    signIn.refused = true;
    relay.onceWaiting(async fake => {
      await expect(approve(fake)).rejects.toThrow("The enrollment host rejected this completion.");
      fake.dropConnection();
    });

    const { lines, exitCode } = await recoverJson();
    await relay.settled();

    expect(exitCode).toBe(1);
    expect(lines.at(-1).error.message).toBe(
      `Recovery did not complete (${RELAY_CLOSED}). Profile "bot" keeps its previous enrollment — ` +
        "run `agent-intent recover` again to retry.",
    );
    expect(storedProfile()).toMatchObject({ trustchainId: "tc-1", accountAccess: ACCOUNT_ACCESS });
    expect(storedProfile()?.pendingRecovery).toBeUndefined();
  });

  it("keeps the previous enrollment when the relay drops the connection before approval", async () => {
    relay.onceWaiting(async fake => fake.dropConnection());

    const { lines, exitCode } = await recoverJson();

    expect(exitCode).toBe(1);
    expect(lines[1].error.message).toContain(`Recovery did not complete (${RELAY_CLOSED})`);
    expect(storedProfile()?.trustchainId).toBe("tc-1");
    expect(storedProfile()?.pendingRecovery).toBeUndefined();
  });

  it("stops waiting on Ctrl+C and clears the recovery marker", async () => {
    relay.onceWaiting(async () => {
      process.emit("SIGINT");
    });

    // bunli's own SIGINT handler settles the exit code, so only the output is checked.
    const { lines } = await withOwnSigint(() => recoverJson());

    expect(lines[1].error.message).toContain("Recovery did not complete (Recovery interrupted.)");
    expect(storedProfile()?.pendingRecovery).toBeUndefined();
  });

  it.each([
    ["removed", () => undefined, (p: StoredProfile | undefined) => expect(p).toBeUndefined()],
    [
      "given another key",
      (p: StoredProfile) => ({ ...p, publicKey: createSoftwareAgentIdentity().publicKey }),
      (p: StoredProfile | undefined) => expect(p?.publicKey).not.toBe(enrolled().agent.publicKey),
    ],
    [
      "marked by a newer recovery",
      (p: StoredProfile) => ({ ...p, pendingRecovery: NEWER_MARKER }),
      (p: StoredProfile | undefined) => expect(p?.pendingRecovery).toEqual(NEWER_MARKER),
    ],
  ])(
    "refuses to record an approval for a profile %s while waiting",
    async (_change, rewrite, expectProfile) => {
      relay.onceWaiting(async fake => {
        rewriteProfile(rewrite);
        await expect(approve(fake)).rejects.toThrow(RELAY_CLOSED);
      });

      const { lines, exitCode } = await recoverJson();
      await relay.settled();

      expect(exitCode).toBe(1);
      expect(lines[1].error.message).toMatch(/was removed or changed while waiting for approval/);
      expectProfile(storedProfile());
    },
  );

  it("reports the recovery once it is saved, even when the relay lost the acknowledgement", async () => {
    relay.dropOnHostMessage = "TrustchainAddedMember";
    relay.onceWaiting(async fake => {
      await expect(approve(fake)).rejects.toThrow(RELAY_CLOSED);
    });

    const { stdout, exitCode } = await recover();
    await relay.settled();

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Agent Intent profile "bot" recovered');
    expect(storedProfile()?.pendingRecovery).toBeUndefined();
  });

  it.each([
    ["an unknown profile", { profileId: "other" }, [], 'No Agent Intent profile named "bot".'],
    [
      "an invalid session record",
      { profile: { environment: "moon" } },
      [],
      /failed to load \(invalid session record\)/,
    ],
    [
      "a profile still pending enrollment",
      { profile: { trustchainId: undefined } },
      [],
      /has not completed enrollment.*agent-intent enroll/,
    ],
    [
      "a stored Keycloak URL with credentials",
      { profile: { keycloakBaseUrl: "https://user:secret@keycloak.example.com/" } },
      [],
      'Agent Intent profile "bot" has an invalid stored Keycloak URL',
    ],
    [
      "a stored non-http Keycloak URL",
      { profile: { keycloakBaseUrl: "file:///etc/keycloak" } },
      [],
      /invalid stored Keycloak URL/,
    ],
    ["an invalid --expires-in", {}, ["--expires-in", "0s"], /--expires-in "0s" is invalid/],
    [
      "an --app-url with credentials",
      {},
      ["--app-url", "https://user:secret@example.com/agent"],
      /--app-url must not contain URL credentials/,
    ],
  ] as const)(
    "refuses %s before reading the agent key or opening the relay",
    async (_case, options, args, message) => {
      await useProfile(options);
      enrolled().keychain.readError = new Error("the agent key was read");

      const { lines, exitCode } = await recoverJson(...args);

      expect(exitCode).toBe(1);
      expect(lines).toHaveLength(1);
      expect(lines[0].error.message).toMatch(message);
      expect(relay.hostOptions).toBeUndefined();
    },
  );
});

const NEWER_MARKER = {
  previousTrustchainId: "tc-1",
  requestSignature: "cd".repeat(64),
  expiresAt: "2099-01-01T01:00:00.000Z",
};

// loadProfileIdentity: every command that signs as the agent reads its key this way.
describe("agent-intent recover (CLI): reading the agent key", () => {
  const other = createSoftwareAgentIdentity();
  let restorePlatform: () => void;

  beforeEach(() => {
    restorePlatform = overridePlatform("linux");
  });
  afterEach(() => restorePlatform());

  const keyFilePath = () =>
    join(cliStateDirIn(enrolled().env.XDG_STATE_HOME), "agent-intent-keys", "bot.key");

  /** Writes the profile's plaintext key file, as `enroll --allow-plaintext-key` does. */
  function writeKeyFile(content: string): void {
    mkdirSync(dirname(keyFilePath()), { recursive: true, mode: 0o700 });
    writeFileSync(keyFilePath(), content, { mode: 0o600 });
  }

  function noSecretService(): void {
    enrolled().keychain.openError = new Error(
      "Platform failure: DBus error: The name org.freedesktop.secrets was not provided",
    );
  }

  /** The keychain entry of `bot`, the only one the profile's keychain holds. */
  function setKeychainEntry(value: string): void {
    const { entries } = enrolled().keychain;
    const [key] = entries.keys();
    entries.set(key, value);
  }

  async function recoverError(): Promise<{ code?: string; message: string }> {
    const { lines, exitCode } = await recoverJson();
    expect(exitCode).toBe(1);
    expect(relay.hostOptions).toBeUndefined();
    return lines[0].error;
  }

  it("asks to make the Secret Service reachable when no OS keychain is available", async () => {
    noSecretService();

    const error = await recoverError();

    expect(error.code).toBe("keychain_unavailable");
    expect(error.message).toMatch(
      /Profile "bot" can't be read here.*Make the Secret Service reachable and re-run.*DBUS_SESSION_BUS_ADDRESS.*Only if a wallet-cli that predates --allow-plaintext-key enrolled it.*kernel keyring.*then that key is gone\. Re-enroll with `wallet-cli agent-intent enroll` under a new --profile id.*--allow-plaintext-key/s,
    );
    expect(error.message).not.toContain("plaintext agent key file exists");
  });

  it("points at a plaintext key file, without reading it, when no OS keychain is available", async () => {
    writeKeyFile(enrolled().agent.exportSecretKey());
    noSecretService();

    const { code, message } = await recoverError();

    expect(code).toBe("keychain_unavailable");
    expect(message).toMatch(
      /plaintext agent key file exists at .*agent-intent-keys[/\\]bot\.key.*set `keyStore: plaintext-file`/s,
    );
  });

  it.each([
    [
      "no entry, no key file",
      () => enrolled().keychain.entries.clear(),
      /^No agent key found in the OS keychain for profile "bot"\. Profiles don't move between machines or users\. Re-enroll/,
    ],
    [
      "no entry but a key file",
      () => {
        enrolled().keychain.entries.clear();
        writeKeyFile(enrolled().agent.exportSecretKey());
      },
      /No agent key found in the OS keychain for profile "bot".*plaintext agent key file exists at .*agent-intent-keys[/\\]bot\.key.*set `keyStore: plaintext-file`/s,
    ],
    [
      "a password-protected entry",
      () => setKeychainEntry("ENC:abcd"),
      /^Could not read the agent key of profile "bot" from the OS keychain \(.*password-protected.*\)\. Re-enroll with `wallet-cli agent-intent enroll` under a new --profile id/,
    ],
    [
      "a locked keychain",
      () => {
        enrolled().keychain.readError = new Error("keychain locked");
      },
      /^Could not read the agent key of profile "bot" from the OS keychain \(keychain locked\)\. Unlock the OS keychain and re-run\.$/,
    ],
    [
      "another agent's key",
      () => setKeychainEntry(other.exportSecretKey()),
      /^The OS keychain key of profile "bot" does not match its recorded public key\.$/,
    ],
  ])("reports an os-keychain profile with %s", async (_case, arrange, message) => {
    arrange();

    expect((await recoverError()).message).toMatch(message);
  });

  it.each([
    [
      "no key file",
      undefined,
      /^No agent key file found for profile "bot" at .*bot\.key\. Profiles don't move between machines or users\. Re-enroll/,
    ],
    [
      "an empty key file",
      "",
      /^The agent key file of profile "bot" \(.*bot\.key\) is empty\. Re-enroll with `wallet-cli agent-intent enroll`/,
    ],
    [
      "a corrupt key file",
      "not-a-hex-key-zzzz",
      /^The agent key file of profile "bot" \(.*bot\.key\) does not hold a valid agent key \(/,
    ],
    [
      "another agent's key file",
      other.exportSecretKey(),
      /^The agent key file of profile "bot" does not match its recorded public key\.$/,
    ],
  ])(
    "reports a plaintext-file profile with %s, never echoing its content",
    async (_case, content, message) => {
      await useProfile({ keyStore: "plaintext-file" });
      // The OS keychain is never consulted for a plaintext-file profile.
      noSecretService();
      if (content === undefined) rmSync(keyFilePath());
      else writeKeyFile(content);

      const { message: error } = await recoverError();

      expect(error).toMatch(message);
      if (content) expect(error).not.toContain(content);
    },
  );
});
