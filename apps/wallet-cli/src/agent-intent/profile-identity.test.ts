import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../shared/ui";
import { KeychainUnavailableError } from "../key-ring/keychain-unavailable-error";
import type { AgentIntentKeyStore } from "../session/session-store";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "../commands/agent-intent/__test-helpers__/agent-intent-mocks";
import { failingKeychainProbe, overridePlatform } from "../testing/os-keychain";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const other = realAgentIntentSdk.createSoftwareAgentIdentity();

let keychainSecret: string | null;
let keychainError: Error | undefined;
let keyFileSecret: string | null;
let keychainProbe: () => unknown;
let keychainReads: number;

beforeAll(() =>
  activateAgentIntentMocks({
    keychain: {
      loadAgentIntentSecretKey: async () => {
        keychainReads++;
        if (keychainError) throw keychainError;
        return keychainSecret;
      },
    },
    keyFile: {
      hasAgentIntentKeyFile: () => keyFileSecret !== null,
      loadAgentIntentKeyFile: () => keyFileSecret,
    },
    keychainProbe: () => keychainProbe(),
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { loadProfileIdentity } = await import("./profile-identity");

describe("loadProfileIdentity", () => {
  let stderr: string[];
  let restore: () => void;
  let restorePlatform: () => void;

  beforeEach(() => {
    restorePlatform = overridePlatform("linux");
    keychainSecret = null;
    keychainError = undefined;
    keyFileSecret = null;
    keychainProbe = () => [];
    keychainReads = 0;
    stderr = [];
    restore = installOutputCapture({ stderr: s => stderr.push(s) });
  });

  afterEach(() => {
    restore();
    restorePlatform();
  });

  const profile = (keyStore: AgentIntentKeyStore) => ({
    profileId: "bot",
    publicKey: agent.publicKey,
    keyStore,
  });

  it("reads an os-keychain profile's key from the OS keychain, without a plaintext warning", async () => {
    keychainSecret = agent.exportSecretKey();

    const identity = await loadProfileIdentity(profile("os-keychain"));

    expect(identity.publicKey).toBe(agent.publicKey);
    expect(stderr).toEqual([]);
  });

  it("tells to make the keychain reachable before re-enrolling an os-keychain profile when none is available", async () => {
    keychainSecret = agent.exportSecretKey();
    keychainProbe = failingKeychainProbe;

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(KeychainUnavailableError);
    expect((err as Error).message).toMatch(
      /Profile "bot" can't be read here.*Make the Secret Service reachable and re-run.*DBUS_SESSION_BUS_ADDRESS.*Only if a wallet-cli that predates --allow-plaintext-key enrolled it.*kernel keyring.*then that key is gone\. Re-enroll with `wallet-cli agent-intent enroll` under a new --profile id.*--allow-plaintext-key/s,
    );
    expect((err as Error).message).not.toContain("plaintext agent key file exists");
    expect(keychainReads).toBe(0);
  });

  it("points at an existing key file, without reading it, when an os-keychain profile can't be read", async () => {
    keyFileSecret = agent.exportSecretKey();
    keychainProbe = failingKeychainProbe;

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(KeychainUnavailableError);
    expect((err as Error).message).toMatch(
      /plaintext agent key file exists at .*agent-intent-keys[/\\]bot\.key.*set `keyStore: plaintext-file`/s,
    );
    expect(stderr).toEqual([]);
  });

  it("reads a plaintext-file profile's key from the file and warns on stderr", async () => {
    keyFileSecret = agent.exportSecretKey();
    keychainProbe = failingKeychainProbe;

    const identity = await loadProfileIdentity(profile("plaintext-file"));

    expect(identity.publicKey).toBe(agent.publicKey);
    expect(keychainReads).toBe(0);
    expect(stderr.join("")).toMatch(
      /Profile "bot" stores its agent key unencrypted in .*agent-intent-keys[/\\]bot\.key/,
    );
  });

  it("reports a missing key file for a plaintext-file profile", async () => {
    await expect(loadProfileIdentity(profile("plaintext-file"))).rejects.toThrow(
      /No agent key file found for profile "bot" at .*bot\.key.*Re-enroll with `wallet-cli agent-intent enroll` under a new --profile id/s,
    );
  });

  it("reports an empty key file as empty, not as missing", async () => {
    keyFileSecret = "";

    await expect(loadProfileIdentity(profile("plaintext-file"))).rejects.toThrow(
      /The agent key file of profile "bot" \(.*bot\.key\) is empty\. Re-enroll with `wallet-cli agent-intent enroll`/,
    );
  });

  it("names the profile and path, never the content, when the key file is corrupt", async () => {
    keyFileSecret = "not-a-hex-key-zzzz";

    const err = await loadProfileIdentity(profile("plaintext-file")).catch((e: unknown) => e);

    expect((err as Error).message).toMatch(
      /agent key file of profile "bot" \(.*bot\.key\) does not hold a valid agent key \(/,
    );
    expect((err as Error).message).not.toContain("not-a-hex-key-zzzz");
  });

  it("checks a key file against the recorded public key", async () => {
    keyFileSecret = other.exportSecretKey();

    await expect(loadProfileIdentity(profile("plaintext-file"))).rejects.toThrow(
      /agent key file of profile "bot" does not match its recorded public key/,
    );
  });

  it("points at an existing key file, without reading it, when an os-keychain profile has no keychain entry", async () => {
    keyFileSecret = agent.exportSecretKey();

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect(err).not.toBeInstanceOf(KeychainUnavailableError);
    expect((err as Error).message).toMatch(
      /No agent key found in the OS keychain for profile "bot".*plaintext agent key file exists at .*agent-intent-keys[/\\]bot\.key.*set `keyStore: plaintext-file`/s,
    );
    expect(stderr).toEqual([]);
  });

  it("reports a missing keychain entry without a key file hint when no key file exists", async () => {
    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect((err as Error).message).toMatch(
      /No agent key found in the OS keychain for profile "bot"/,
    );
    expect((err as Error).message).not.toContain("plaintext agent key file exists");
  });

  it("asks for a new profile when the OS keychain key can never be read again", async () => {
    keychainError = Object.assign(new Error("corrupt"), {
      name: "AgentIntentCorruptKeychainError",
    });

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect((err as Error).message).toMatch(
      /Could not read the agent key of profile "bot" from the OS keychain \(corrupt\)\. Re-enroll with `wallet-cli agent-intent enroll` under a new --profile id/,
    );
    expect((err as Error).message).not.toContain("Unlock");
  });

  it("asks to unlock the OS keychain when reading the key fails otherwise", async () => {
    keychainError = new Error("keychain locked");

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect((err as Error).message).toMatch(
      /Could not read the agent key of profile "bot" from the OS keychain \(keychain locked\)\. Unlock the OS keychain and re-run\.$/,
    );
  });

  it("checks an OS keychain key against the recorded public key", async () => {
    keychainSecret = other.exportSecretKey();

    await expect(loadProfileIdentity(profile("os-keychain"))).rejects.toThrow(
      /OS keychain key of profile "bot" does not match its recorded public key/,
    );
  });
});
