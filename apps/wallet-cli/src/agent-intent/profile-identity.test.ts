import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../shared/ui";
import { KeychainUnavailableError } from "../key-ring/keychain-entry";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "../commands/agent-intent/__test-helpers__/agent-intent-mocks";
import { failingKeychainProbe, overridePlatform } from "../testing/os-keychain";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const other = realAgentIntentSdk.createSoftwareAgentIdentity();

let keychainSecret: string | null;
let keyFileSecret: string | null;
let keychainProbe: () => unknown;
let keychainReads: number;

beforeAll(() =>
  activateAgentIntentMocks({
    keychain: {
      loadAgentIntentSecretKey: async () => {
        keychainReads++;
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

  const profile = (keyStore: "os-keychain" | "plaintext-file") => ({
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

  it("refuses an os-keychain profile with enroll-a-new-profile guidance when no OS keychain is available", async () => {
    keychainSecret = agent.exportSecretKey();
    keychainProbe = failingKeychainProbe;

    const err = await loadProfileIdentity(profile("os-keychain")).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(KeychainUnavailableError);
    expect((err as Error).message).toMatch(
      /Profile "bot" keeps its agent key in the OS keychain.*new --profile id.*--allow-plaintext-key/s,
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
      /No agent key file found for profile "bot" at .*bot\.key.*enroll a fresh profile here/s,
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

  it("checks an OS keychain key against the recorded public key", async () => {
    keychainSecret = other.exportSecretKey();

    await expect(loadProfileIdentity(profile("os-keychain"))).rejects.toThrow(
      /OS keychain key of profile "bot" does not match its recorded public key/,
    );
  });
});
