import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import type { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { YAML } from "bun";
import { deriveWrappingKey } from "../../key-ring/crypto";
import { loadMemberCredentials, savePrivateKey } from "../../key-ring/keychain";
import { _setTestKeychain } from "../../key-ring/keychain-entry";
import { _setTestLkrpSdk } from "../../key-ring/lkrp-sdk";
import { _setTestControllingTtyPath } from "../../key-ring/prompt";
import { loadKeyRing } from "../../key-ring/load-key-ring";
import { runCli, storedApiAuthPubkey, type RunResult } from "../../testing/cli-runner";
import { makeSessionDir, writeSessionIn } from "../../testing/session-fixture";
import { cliStateDirIn, pointStateHomeAt } from "../../testing/state-home";
import { pipedStdin, terminalTyping, withStdin } from "../../testing/fake-stdin";
import { ETH_DESCRIPTOR } from "../../testing/constants";
import { makeAuthenticatedQuoteServer } from "../../testing/authenticated-quote-server";
import { InMemoryKeychain } from "../../testing/in-memory-keychain";
import { useFastPasswordKdf } from "../../testing/fast-password-kdf";
import { resetTestSeams } from "../../shared/test-seam";

function runCliWithStdin(
  args: string[],
  env: Record<string, string>,
  stdinLines: string[],
): Promise<RunResult> {
  const origDesc = Object.getOwnPropertyDescriptor(process, "stdin");
  const fakeStdin = new Readable({ read() {} });
  for (const line of stdinLines) fakeStdin.push(`${line}\n`);
  fakeStdin.push(null);
  Object.defineProperty(process, "stdin", { get: () => fakeStdin, configurable: true });
  return runCli(args, env).finally(() => {
    if (origDesc) Object.defineProperty(process, "stdin", origDesc);
  });
}

// Fake OS keychain so tests never touch macOS Keychain / libsecret.
const keychain = new InMemoryKeychain();
const _store = keychain.entries;
let kdf: ReturnType<typeof useFastPasswordKdf>;
beforeAll(() => {
  kdf = useFastPasswordKdf();
  _setTestKeychain(keychain.open);
});
afterAll(() => {
  resetTestSeams();
  kdf.restore();
});
// A test that fakes LKRP SDK methods hands the next one back the real (WALLET_CLI_MOCK) SDK.
afterEach(() => _setTestLkrpSdk(null));

/** Makes the commands' LKRP SDK one with only `methods`, for the rest of the test. */
function useLkrpSdk(methods: Partial<TrustchainSDK>): void {
  _setTestLkrpSdk(() => methods as TrustchainSDK);
}

const MOCK_ENV = { WALLET_CLI_MOCK: "1" };
const MOCK_ENV_DMK = { ...MOCK_ENV, WALLET_CLI_MOCK_DMK: "1" };

function makeTmpDir(): { env: Record<string, string>; dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "wallet-cli-ring-test-"));
  return {
    dir,
    env: { XDG_STATE_HOME: dir, ...MOCK_ENV },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

describe("ring — not initialized", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("keys exits 1", async () => {
    expect((await runCli(["ring", "keys"], env)).exitCode).toBe(1);
  });

  it("encrypt exits 1", async () => {
    expect((await runCli(["ring", "encrypt", "--key", "x"], env)).exitCode).toBe(1);
  });

  it("decrypt exits 1", async () => {
    expect((await runCli(["ring", "decrypt", "--key", "x"], env)).exitCode).toBe(1);
  });

  it("destroy exits 1", async () => {
    expect((await runCli(["ring", "destroy"], env)).exitCode).toBe(1);
  });
});

describe("ring — happy path", () => {
  let dir: string;
  let env: Record<string, string>;
  let initResult: RunResult;
  let plainFile: string;
  let encFile: string;
  let decFile: string;

  // Every test starts from a freshly initialized ring, so none depends on another having run first.
  beforeEach(async () => {
    _store.clear();
    ({ dir, env } = makeTmpDir());
    plainFile = join(dir, "plain.txt");
    encFile = join(dir, "test.enc");
    decFile = join(dir, "test.dec");
    await Bun.write(plainFile, "hello key ring");

    initResult = await runCli(["ring", "init", "--name", "test-member", "--unsecure-no-password"], {
      ...env,
      ...MOCK_ENV_DMK,
    });
    expect(initResult.exitCode, `init failed: ${initResult.stderr}`).toBe(0);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  async function encryptPlainFile(): Promise<void> {
    const r = await runCli(
      ["ring", "encrypt", "--key", "prod", "--input", plainFile, "--out", encFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
  }

  it("init outputs member name and root id", () => {
    expect(initResult.stdout).toContain("test-member");
    expect(initResult.stdout).toContain("mock-root-id");
  });

  it("init fails when already initialized", async () => {
    const r = await runCli(["ring", "init"], { ...env, ...MOCK_ENV_DMK });
    expect(r.exitCode).toBe(1);
  });

  it("keys shows no keys after init", async () => {
    const r = await runCli(["ring", "keys"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/no keys/i);
  });

  it("keys --output json returns empty keys array", async () => {
    const r = await runCli(["ring", "keys", "--output", "json"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.command).toBe("ring keys");
    expect(data.keys).toHaveLength(0);
  });

  it("encrypt writes ciphertext to file", async () => {
    await encryptPlainFile();
    const ct = await Bun.file(encFile).arrayBuffer();
    expect(ct.byteLength).toBeGreaterThan("hello key ring".length);
  });

  it.skipIf(process.platform === "win32")(
    "encrypt writes the output file with 0600 permissions",
    async () => {
      await encryptPlainFile();
      expect(statSync(encFile).mode & 0o777).toBe(0o600);
    },
  );

  it("keys shows key after encrypt", async () => {
    await encryptPlainFile();
    const r = await runCli(["ring", "keys"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).toContain("prod");
  });

  it("encrypt --output json reports dest and bytes", async () => {
    const r = await runCli(
      [
        "ring",
        "encrypt",
        "--key",
        "prod",
        "--input",
        plainFile,
        "--out",
        encFile,
        "--output",
        "json",
      ],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.output).toBe(encFile);
    expect(data.bytes).toBeGreaterThan(0);
  });

  it("decrypt round-trips plaintext from file", async () => {
    await encryptPlainFile();
    const r = await runCli(
      ["ring", "decrypt", "--key", "prod", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    expect(await Bun.file(decFile).text()).toBe("hello key ring");
  });

  it("decrypt --output json reports dest", async () => {
    await encryptPlainFile();
    const r = await runCli(
      [
        "ring",
        "decrypt",
        "--key",
        "prod",
        "--input",
        encFile,
        "--out",
        decFile,
        "--output",
        "json",
      ],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.output).toBe(decFile);
  });

  it("decrypt with wrong key name fails", async () => {
    await encryptPlainFile();
    const r = await runCli(
      ["ring", "decrypt", "--key", "wrong", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode).toBe(1);
  });

  it("destroy wipes the ring after confirmation", async () => {
    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0);
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode).toBe(1);
  });
});

describe("ring init — password", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("rejects an empty password", async () => {
    const r = await runCli(["ring", "init", "--name", "pw-member", "--output", "json"], {
      ...env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "",
    });
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/must not be empty/i);
  });
});

describe("ring init — password strength", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("derives the key wrapping the ring from the password with 600,000 PBKDF2 iterations", async () => {
    const before = kdf.requestedIterations.length;

    const r = await runCli(["ring", "init", "--name", "pw-member"], {
      ...env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "correct horse",
    });

    expect(r.exitCode, r.stderr).toBe(0);
    expect(kdf.requestedIterations.slice(before)).toEqual([600_000]);
  });
});

describe("ring — with password", () => {
  let dir: string;
  let env: Record<string, string>;
  let initResult: RunResult;
  let plainFile: string;
  let encFile: string;

  // Every test starts from a freshly initialized ring, so none depends on another having run first.
  beforeEach(async () => {
    _store.clear();
    ({ dir, env } = makeTmpDir());
    plainFile = join(dir, "plain.txt");
    encFile = join(dir, "test.enc");
    await Bun.write(plainFile, "hello password");

    initResult = await runCli(["ring", "init", "--name", "pw-member"], {
      ...env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "testpw",
    });
    expect(initResult.exitCode, `init failed: ${initResult.stderr}`).toBe(0);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  async function destroyWith(password: string): Promise<RunResult> {
    return runCliWithStdin(["ring", "destroy"], { ...env, WALLET_PASS: password }, ["destroy"]);
  }

  it("init stores the member's private key password-wrapped", () => {
    expect(initResult.stdout).toContain("pw-member");
    expect([..._store.values()].some(v => v.startsWith("ENC:"))).toBe(true);
  });

  it("encrypt with correct password decrypts member credentials", async () => {
    const r = await runCli(
      [
        "ring",
        "encrypt",
        "--key",
        "prod",
        "--input",
        plainFile,
        "--out",
        encFile,
        "--output",
        "json",
      ],
      { ...env, WALLET_PASS: "testpw" },
    );
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).not.toMatch(/[Ww]rong password/);
    expect(r.stdout).not.toMatch(/[Mm]ember credentials not found/);
  });

  it("encrypt with wrong password fails at decryption", async () => {
    const r = await runCli(
      [
        "ring",
        "encrypt",
        "--key",
        "prod",
        "--input",
        plainFile,
        "--out",
        encFile,
        "--output",
        "json",
      ],
      { ...env, WALLET_PASS: "wrongpw" },
    );
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/[Ww]rong password/);
  });

  it("destroy with wrong password aborts without wiping the ring", async () => {
    const r = await destroyWith("wrongpw");
    expect(r.exitCode).toBe(1);
    // `ring keys` still succeeds → the ring was not wiped.
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode, keys.stderr).toBe(0);
  });

  it("destroy with an empty WALLET_PASS aborts without wiping the ring", async () => {
    // Empty WALLET_PASS is a mistake (failed substitution), not a skip.
    const r = await destroyWith("");
    expect(r.exitCode).toBe(1);
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode, keys.stderr).toBe(0);
  });

  it("destroy with the correct password wipes the ring", async () => {
    const r = await destroyWith("testpw");
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0);
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode).toBe(1);
  });
});

describe("ring — the API auth key stays separate from a password-protected ring", () => {
  const { server, runQuoteAndGetAuthSignature } = makeAuthenticatedQuoteServer();
  const accounts = [{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }];
  let fixture: ReturnType<typeof makeSessionDir>;

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  // Every test starts from a freshly initialized ring, so none depends on another having run first.
  // The API auth key lives in this file's fake keychain next to the ring key, so a teardown that
  // deleted it would show.
  beforeEach(async () => {
    _store.clear();
    fixture = makeSessionDir(accounts);
    const init = await runCli(["ring", "init", "--name", "auth-member"], {
      ...fixture.env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "testpw",
    });
    expect(init.exitCode, init.stderr).toBe(0);
  });

  afterEach(() => fixture.cleanup());

  it("authenticates swap requests without the ring password or its trustchain", async () => {
    const signature = await runQuoteAndGetAuthSignature(fixture.env);

    expect(signature.attestation).toBeUndefined();
    expect(await storedApiAuthPubkey(fixture.env)).toBe(signature.credential.publicKey);
  });

  it("keeps the same API auth key after ring destroy", async () => {
    const before = (await runQuoteAndGetAuthSignature(fixture.env)).credential.publicKey;

    const destroy = await runCliWithStdin(
      ["ring", "destroy"],
      { ...fixture.env, ...MOCK_ENV, WALLET_PASS: "testpw" },
      ["destroy"],
    );
    expect(destroy.exitCode, destroy.stderr).toBe(0);

    expect(await storedApiAuthPubkey(fixture.env)).toBe(before);
    expect((await runQuoteAndGetAuthSignature(fixture.env)).credential.publicKey).toBe(before);
  });

  it("keeps the same API auth key after session reset", async () => {
    const before = (await runQuoteAndGetAuthSignature(fixture.env)).credential.publicKey;

    const reset = await runCli(["session", "reset"], fixture.env);
    expect(reset.exitCode, reset.stderr).toBe(0);
    expect(await storedApiAuthPubkey(fixture.env)).toBe(before);

    // Reset empties the accounts but keeps the ring, so re-add the one the quote needs on top of it.
    const sessionPath = fixture.sessionPath;
    const session = YAML.parse(await Bun.file(sessionPath).text()) as Record<string, unknown>;
    writeFileSync(sessionPath, YAML.stringify({ ...session, accounts }));
    expect((await runQuoteAndGetAuthSignature(fixture.env)).credential.publicKey).toBe(before);
  });
});

describe("ring — uninitialized with a stray password-protected key", () => {
  const { dir, cleanup } = makeTmpDir();
  afterAll(cleanup);

  // Asserted at unit level because Bunli prints a plain Error to the real stderr, which runCli's
  // output capture does not observe.
  it("throws 'not initialized' rather than a password error", async () => {
    const restoreStateHome = pointStateHomeAt(dir); // pin the session dir + keychain account to this temp dir
    try {
      _store.clear();
      const wrappingKey = await deriveWrappingKey("pw", "0".repeat(32));
      await savePrivateKey("aa".repeat(32), "bb".repeat(33), wrappingKey);

      // No `ring init` ran, so there is no trustchain on disk.
      await expect(loadKeyRing()).rejects.toThrow(/not initialized/i);
      await expect(loadKeyRing()).rejects.not.toThrow(/password/i);
    } finally {
      restoreStateHome();
    }
  });
});

describe("ring init — orphan guard", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("refuses to init over a stray keychain key when the session has no trustchain", async () => {
    const restoreStateHome = pointStateHomeAt(dir); // pin the keychain account to this temp dir
    try {
      _store.clear();
      await savePrivateKey("aa".repeat(32), "bb".repeat(33)); // stray key, no trustchain on disk
    } finally {
      restoreStateHome();
    }

    const before = [..._store.values()];
    const r = await runCli(["ring", "init", "--unsecure-no-password", "--output", "json"], {
      ...env,
      ...MOCK_ENV_DMK,
    });
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/already exists in the OS keychain/i);
    expect([..._store.values()]).toEqual(before); // stray key untouched
  });
});

describe("ring — CRLF-stored keychain entry", () => {
  const { dir, cleanup } = makeTmpDir();
  afterAll(cleanup);

  // Regression guard for a bare split("\n"), which left a trailing \r on the private-key line.
  it("loadMemberCredentials strips \\r from a CRLF-joined entry", async () => {
    const restoreStateHome = pointStateHomeAt(dir);
    try {
      _store.clear();
      const priv = "aa".repeat(32);
      const pub = "bb".repeat(33);
      await savePrivateKey(priv, pub); // stores "priv\npub" under this state dir's account
      // Rewrite the stored value with CRLF to simulate a Windows-written entry.
      for (const [k, v] of _store) _store.set(k, v.replaceAll("\n", "\r\n"));

      const creds = await loadMemberCredentials();
      expect(creds?.privatekey).toBe(priv);
      expect(creds?.pubkey).toBe(pub);
    } finally {
      restoreStateHome();
    }
  });
});

describe("ring — password-protected keychain entry decode errors", () => {
  const { dir, cleanup } = makeTmpDir();
  afterAll(cleanup);

  async function withStateDir<T>(fn: () => Promise<T>): Promise<T> {
    const restoreStateHome = pointStateHomeAt(dir); // pin the keychain account to this temp dir
    try {
      return await fn();
    } finally {
      restoreStateHome();
    }
  }

  it("reports corruption (not a wrong password) for a non-hex ENC payload", async () => {
    await withStateDir(async () => {
      _store.clear();
      const wrappingKey = await deriveWrappingKey("pw", "0".repeat(32));
      await savePrivateKey("aa".repeat(32), "bb".repeat(33), wrappingKey);
      for (const [k, v] of _store) _store.set(k, v.replace(/^ENC:[0-9a-f]+/, "ENC:zzzz"));

      await expect(loadMemberCredentials(wrappingKey)).rejects.toThrow(/not valid hex/i);
      await expect(loadMemberCredentials(wrappingKey)).rejects.not.toThrow(/wrong password/i);
    });
  });

  it("reports a wrong password when the ENC payload is valid hex but does not decrypt", async () => {
    await withStateDir(async () => {
      _store.clear();
      const stored = await deriveWrappingKey("right", "0".repeat(32));
      await savePrivateKey("aa".repeat(32), "bb".repeat(33), stored);

      const wrong = await deriveWrappingKey("wrong", "0".repeat(32));
      await expect(loadMemberCredentials(wrong)).rejects.toThrow(/wrong password/i);
    });
  });
});

describe("ring destroy — stray key with no trustchain (local-only recovery)", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("wipes the stray local key and unblocks a fresh init", async () => {
    _store.clear();
    const restoreStateHome = pointStateHomeAt(dir); // pin the keychain account to this temp dir
    try {
      await savePrivateKey("aa".repeat(32), "bb".repeat(33)); // stray key, no trustchain on disk
    } finally {
      restoreStateHome();
    }
    expect([..._store.values()]).toHaveLength(1);

    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0); // stray key wiped locally

    // init now succeeds — the recovery path `init` advertised actually works.
    const init = await runCli(["ring", "init", "--name", "recovered", "--unsecure-no-password"], {
      ...env,
      ...MOCK_ENV_DMK,
    });
    expect(init.exitCode, init.stderr).toBe(0);
  });
});

describe("ring encrypt — salt without trustchain must not prompt", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("throws 'not initialized' without asking for a password", async () => {
    writeSessionIn(dir, { accounts: [], passwordSalt: "0".repeat(32) });

    // Pass --input to skip the TTY-dependent "No input" guard, so the trustchain check is reached
    // regardless of TTY state. The file is never read — the throw precedes the input read.
    const inputFile = join(dir, "plain.txt");
    writeFileSync(inputFile, "payload");

    const r = await runCli(
      [
        "ring",
        "encrypt",
        "--key",
        "x",
        "--input",
        inputFile,
        "--out",
        join(dir, "o.enc"),
        "--output",
        "json",
      ],
      env,
    );
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/not initialized/i);
    // No password prompt: the trustchain check short-circuits before resolveWrappingKey.
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/password/i);
  });
});

describe("ring destroy — corrupt keychain entry with a trustchain (local-wipe recovery)", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("local-wipes a corrupt entry instead of aborting, so init can recover", async () => {
    _store.clear();
    const init = await runCli(["ring", "init", "--name", "corrupt-me"], {
      ...env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "testpw",
    });
    expect(init.exitCode, init.stderr).toBe(0);

    // Corrupt the stored ENC payload to non-hex: the right password still derives a valid wrapping
    // key, but the payload can't decode — so the key can never authenticate the remote teardown.
    for (const [k, v] of _store) _store.set(k, v.replace(/^ENC:[0-9a-f]+/, "ENC:zzzz"));

    // Pre-fix this aborted (exit 1) and stranded the user behind the init guard; now it local-wipes.
    const r = await runCliWithStdin(["ring", "destroy"], { ...env, WALLET_PASS: "testpw" }, [
      "destroy",
    ]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0); // corrupt key wiped locally

    const recover = await runCli(
      ["ring", "init", "--name", "recovered", "--unsecure-no-password"],
      {
        ...env,
        ...MOCK_ENV_DMK,
      },
    );
    expect(recover.exitCode, recover.stderr).toBe(0);
  });
});

describe("ring destroy — transient remote failure keeps the local key", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("aborts with exit 1 and leaves the keychain key intact", async () => {
    _store.clear();
    const init = await runCli(["ring", "init", "--name", "net", "--unsecure-no-password"], {
      ...env,
      ...MOCK_ENV_DMK,
    });
    expect(init.exitCode, init.stderr).toBe(0);
    const before = [..._store.values()];
    expect(before).toHaveLength(1);

    // Simulate a transient remote failure: destroyApplication throws a non-ejected error.
    useLkrpSdk({
      destroyApplication: async () => {
        throw new Error("network down");
      },
    });

    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode).toBe(1);
    expect([..._store.values()]).toEqual(before); // key kept — no orphaning on a transient failure
  });
});

const SEED_TRUSTCHAIN = { rootId: "seed-root", applicationPath: "m/0'/17'/0'" };

// Seeds ring state (session + keychain) without `ring init`, so a test fakes only the LKRP SDK
// method under test. With `wrappedBy`, the key is stored password-protected.
async function seedRing(
  dir: string,
  session: Record<string, unknown>,
  wrappedBy?: { password: string; salt: string },
): Promise<void> {
  writeSessionIn(dir, { accounts: [], ...session });
  // savePrivateKey hashes the account name from the state dir, so pin it to this temp dir (matching
  // the env passed to runCli) before saving.
  const restoreStateHome = pointStateHomeAt(dir);
  try {
    const wrappingKey = wrappedBy && (await deriveWrappingKey(wrappedBy.password, wrappedBy.salt));
    await savePrivateKey("aa".repeat(32), "bb".repeat(33), wrappingKey);
  } finally {
    restoreStateHome();
  }
}

function seedInitializedRing(dir: string): Promise<void> {
  return seedRing(dir, { trustchain: SEED_TRUSTCHAIN });
}

function readSession(dir: string): Record<string, unknown> {
  return YAML.parse(readFileSync(join(cliStateDirIn(dir), "session.yaml"), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("ring destroy — ejected member wipes locally", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("treats TrustchainEjected as remote-already-gone and wipes the key (exit 0)", async () => {
    _store.clear();
    await seedInitializedRing(dir);
    expect([..._store.values()]).toHaveLength(1);

    // destroyApplication is idempotent on an already-closed stream (returns without throwing), so
    // TrustchainEjected means this member is no longer on the ring (removed by another owner, or the
    // trustchain was destroyed remotely): the remote is gone for us, so destroy should proceed to the
    // local wipe rather than abort.
    useLkrpSdk({
      destroyApplication: async () => {
        throw new TrustchainEjected("not a member of trustchain");
      },
    });

    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0); // key wiped despite the remote being already gone
    expect(r.stdout).toMatch(/no longer a member/i);
  });
});

describe("ring encrypt/decrypt — closed application stream gives reactivation guidance", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("the encrypt command fails on an ejected stream (but succeeds on an open one)", async () => {
    // Self-contained: seed the ring state here too so the test passes when run in isolation (filtered).
    _store.clear();
    await seedInitializedRing(dir);
    const inputFile = join(dir, "plain.txt");
    writeFileSync(inputFile, "payload");
    const outFile = join(dir, "o.enc");
    const encryptArgs = [
      "ring",
      "encrypt",
      "--key",
      "mykey",
      "--input",
      inputFile,
      "--out",
      outFile,
    ];

    // Positive control: with an open stream, the exact same command succeeds and writes ciphertext.
    useLkrpSdk({
      restoreTrustchain: async () => ({
        rootId: "seed-root",
        applicationPath: "m/0'/17'/0'", // matches the seed → no rotation warning
        walletSyncEncryptionKey: "00".repeat(32),
      }),
    });
    const ok = await runCli(encryptArgs, env);
    expect(ok.exitCode, ok.stderr).toBe(0);
    expect(existsSync(outFile)).toBe(true);

    // Now the stream is ejected (deactivated elsewhere): the same command must fail with the way
    // back, and must NOT leave ciphertext behind.
    rmSync(outFile, { force: true });
    useLkrpSdk({
      restoreTrustchain: async () => {
        throw new TrustchainEjected("application stream is closed");
      },
    });
    const r = await runCli([...encryptArgs, "--output", "json"], env);
    expect(r.exitCode).toBe(1);
    expect(JSON.parse(r.stdout).error.message).toBe(
      "The wallet-cli application is no longer active on this Ledger Key Ring (deactivated " +
        "elsewhere, or this member was removed). Run `wallet-cli ring destroy` then " +
        "`wallet-cli ring init` to reactivate.",
    );
    expect(existsSync(outFile)).toBe(false); // aborted before writing ciphertext
  });
});

describe("ring destroy — non-destructive deactivation keeps the ring but wipes locally", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("reports the app was deactivated (kept for other apps), wipes locally, and unblocks re-init", async () => {
    _store.clear();
    await seedInitializedRing(dir);

    // Non-destructive close: destroyApplication closes only the wallet-cli stream (the trustchain is
    // kept for other applications), so trustchainDestroyed is false.
    useLkrpSdk({
      destroyApplication: async () => ({ trustchainDestroyed: false }),
    });
    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0); // local credentials still wiped
    expect(r.stdout).toMatch(/kept for other apps/i);

    // Reactivation is unblocked: destroy cleared the local trustchain pointer, so the ring is no
    // longer "initialized" and `ring init` (which reopens a closed stream on the next index — covered
    // at the lib level) would run instead of hitting the "already initialized" guard.
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode).toBe(1); // not initialized → init guard is clear
  });
});

/** Stdin where the user types "destroy" once `meanwhile`, another command, has run. */
function typeDestroyAfter(meanwhile: () => void): Readable {
  let typed = false;
  return new Readable({
    read() {
      if (typed) return;
      typed = true;
      meanwhile();
      this.push("destroy\n");
      this.push(null);
    },
  });
}

describe("ring destroy — confirmation, password and concurrent changes", () => {
  const SALT = "0".repeat(32);
  const OTHER_RING = { rootId: "seed-root", applicationPath: "m/0'/17'/1'" };
  let dir: string;
  let env: Record<string, string>;
  let remoteDestroys: number;

  beforeEach(() => {
    _store.clear();
    ({ dir, env } = makeTmpDir());
    remoteDestroys = 0;
    useLkrpSdk({
      destroyApplication: async () => {
        remoteDestroys += 1;
        return { trustchainDestroyed: true };
      },
    });
  });
  afterEach(() => {
    _setTestControllingTtyPath(null);
    rmSync(dir, { recursive: true, force: true });
  });

  function destroy(stdin: Readable, ...args: string[]) {
    return withStdin(stdin, () => runCli(["ring", "destroy", ...args], env));
  }

  async function destroyJson(stdin: Readable, extraEnv: Record<string, string> = {}) {
    const run = await withStdin(stdin, () =>
      runCli(["ring", "destroy", "--output", "json"], { ...env, ...extraEnv }),
    );
    return { ...run, json: JSON.parse(run.stdout) };
  }

  const LOCALLY_WIPED =
    "✔ Ledger Key Ring local credentials wiped (remote teardown skipped or failed).";

  it.each([
    ["an initialized ring", { trustchain: SEED_TRUSTCHAIN }],
    ["a stray key", { trustchain: undefined }],
  ])("keeps %s when the user types anything but destroy", async (_, session) => {
    await seedRing(dir, session);

    const { json, exitCode } = await destroyJson(pipedStdin("yes\n"));

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ status: "success", cancelled: true });
    expect(_store.size).toBe(1);
    expect(readSession(dir).trustchain).toEqual(session.trustchain);
    expect(remoteDestroys).toBe(0);
  });

  it("wipes locally without the remote teardown when Enter is pressed at the password prompt", async () => {
    await seedRing(
      dir,
      { trustchain: SEED_TRUSTCHAIN, passwordSalt: SALT },
      { password: "pw", salt: SALT },
    );

    const { stdout, exitCode, stderr } = await destroy(terminalTyping("destroy\n", "\r"));

    expect(exitCode, stderr).toBe(0);
    expect(stderr).toContain("No password provided — continuing with local wipe.");
    expect(stdout).toBe(LOCALLY_WIPED);
    expect(remoteDestroys).toBe(0);
    expect(_store.size).toBe(0);
    expect(readSession(dir)).toEqual({ accounts: [] });
  });

  it("aborts without a terminal to ask the password on, or WALLET_PASS", async () => {
    await seedRing(
      dir,
      { trustchain: SEED_TRUSTCHAIN, passwordSalt: SALT },
      { password: "pw", salt: SALT },
    );
    _setTestControllingTtyPath(join(dir, "no-tty"));

    const { json, exitCode } = await destroyJson(pipedStdin("destroy\n"));

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain(
      "Password required but no TTY available and WALLET_PASS is not set.",
    );
    expect(json.error.message).toContain("Aborting — no changes made. Re-run with the correct");
    expect(_store.size).toBe(1);
    expect(readSession(dir).trustchain).toEqual(SEED_TRUSTCHAIN);
  });

  it("keeps a password-protected key when the remote teardown fails, and offers the skip", async () => {
    await seedRing(
      dir,
      { trustchain: SEED_TRUSTCHAIN, passwordSalt: SALT },
      { password: "pw", salt: SALT },
    );
    useLkrpSdk({
      destroyApplication: async () => {
        throw new Error("network down");
      },
    });

    const { json, exitCode } = await destroyJson(pipedStdin("destroy\n"), { WALLET_PASS: "pw" });

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe(
      "Remote teardown failed (network/backend). No local changes made — retry when connectivity " +
        "is restored or re-run and press Enter at the password prompt to skip the remote teardown " +
        "and wipe locally.",
    );
    expect(_store.size).toBe(1);
  });

  it("aborts on a password-protected key once the session lost its password salt", async () => {
    // A malformed salt reads as none, so nothing can unlock the key to authenticate the teardown.
    await seedRing(
      dir,
      { trustchain: SEED_TRUSTCHAIN, passwordSalt: "not-a-salt" },
      { password: "pw", salt: SALT },
    );

    const { json, exitCode } = await destroyJson(pipedStdin("destroy\n"));

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain("this session has no password metadata to unlock it");
    expect(remoteDestroys).toBe(0);
    expect(_store.size).toBe(1);
  });

  it("wipes the ring locally when the keychain holds no key for it", async () => {
    writeSessionIn(dir, { accounts: [], trustchain: SEED_TRUSTCHAIN });

    const { stdout, exitCode, stderr } = await destroy(pipedStdin("destroy\n"));

    expect(exitCode, stderr).toBe(0);
    expect(stderr).toContain("No credentials found in keychain — continuing with local wipe.");
    expect(stdout).toBe(LOCALLY_WIPED);
    expect(remoteDestroys).toBe(0);
    expect(readSession(dir).trustchain).toBeUndefined();
  });

  it("leaves a stray key alone once another command initialized a ring during the confirmation", async () => {
    await seedRing(dir, {});

    const { json, exitCode } = await destroyJson(
      typeDestroyAfter(() => writeSessionIn(dir, { accounts: [], trustchain: SEED_TRUSTCHAIN })),
    );

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain(
      "Ledger Key Ring was initialized by another process while this destroy was waiting",
    );
    expect(_store.size).toBe(1);
    expect(readSession(dir).trustchain).toEqual(SEED_TRUSTCHAIN);
  });

  it("tears nothing down once the ring changed during the confirmation", async () => {
    await seedInitializedRing(dir);

    const { json, exitCode } = await destroyJson(
      typeDestroyAfter(() => writeSessionIn(dir, { accounts: [], trustchain: OTHER_RING })),
    );

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain(
      "Ledger Key Ring changed locally while this destroy was waiting for confirmation/password",
    );
    expect(remoteDestroys).toBe(0);
    expect(_store.size).toBe(1);
  });

  it("keeps the local ring that replaced the one torn down remotely", async () => {
    await seedInitializedRing(dir);
    useLkrpSdk({
      destroyApplication: async () => {
        writeSessionIn(dir, { accounts: [], trustchain: OTHER_RING });
        return { trustchainDestroyed: true };
      },
    });

    const { json, exitCode } = await destroyJson(pipedStdin("destroy\n"));

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain(
      "The remote teardown above completed, but the local pointer was left untouched",
    );
    expect(_store.size).toBe(1);
    expect(readSession(dir).trustchain).toEqual(OTHER_RING);
  });
});

describe("ring encrypt/decrypt — stdin, stdout and ring changes", () => {
  const ROTATED = { rootId: "seed-root", applicationPath: "m/0'/17'/1'" };
  let dir: string;
  let env: Record<string, string>;
  let encFile: string;

  beforeEach(async () => {
    _store.clear();
    ({ dir, env } = makeTmpDir());
    encFile = join(dir, "secret.enc");
    await seedInitializedRing(dir);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  /** The ring as LKRP restores it, at `applicationPath`; `meanwhile` runs as it does. */
  function restoreRingAt(applicationPath: string, meanwhile = () => {}): void {
    useLkrpSdk({
      restoreTrustchain: async () => {
        meanwhile();
        return { rootId: "seed-root", applicationPath, walletSyncEncryptionKey: "00".repeat(32) };
      },
    });
  }

  function ring(command: "encrypt" | "decrypt", ...args: string[]) {
    return runCli(["ring", command, "--key", "notes", ...args], env);
  }

  function encryptFile(text: string) {
    const plainFile = join(dir, "secret.txt");
    writeFileSync(plainFile, text);
    return ring("encrypt", "--input", plainFile, "--out", encFile);
  }

  it("refuses JSON to stdout, and a terminal as input", async () => {
    const json = await ring("encrypt", "--input", encFile, "--output", "json");
    const terminal = await withStdin(terminalTyping(), () =>
      ring("encrypt", "--out", encFile, "--output", "json"),
    );

    expect(json.exitCode).toBe(1);
    expect(JSON.parse(json.stdout).error.message).toContain(
      "--output json requires --out <file>: binary ciphertext cannot be written as JSON to stdout.",
    );
    expect(terminal.exitCode).toBe(1);
    expect(JSON.parse(terminal.stdout).error.message).toBe(
      "No input: provide --input FILE or pipe data to stdin.",
    );
  });

  it("decrypts to stdout", async () => {
    restoreRingAt(SEED_TRUSTCHAIN.applicationPath);

    const encrypt = await encryptFile("meet at noon");
    const decrypt = await ring("decrypt", "--input", encFile);

    expect(encrypt.exitCode, encrypt.stderr).toBe(0);
    expect(decrypt.exitCode, decrypt.stderr).toBe(0);
    expect(decrypt.stdout).toBe("meet at noon");
    expect(readSession(dir).domains).toEqual([{ domain: "notes", firstUsed: expect.any(String) }]);
  });

  it("records a ring rotation before encrypting with the new key", async () => {
    restoreRingAt(ROTATED.applicationPath);

    const { exitCode, stderr } = await encryptFile("x");

    expect(exitCode, stderr).toBe(0);
    expect(stderr).toContain("⚠ Ledger Key Ring rotated since last use");
    expect(readSession(dir)).toMatchObject({
      trustchain: ROTATED,
      domains: [{ domain: "notes" }],
    });
  });

  it("warns, and tracks no key, when the ring changed while encrypting", async () => {
    restoreRingAt(SEED_TRUSTCHAIN.applicationPath, () =>
      writeSessionIn(dir, { accounts: [], trustchain: ROTATED }),
    );

    const { exitCode, stderr } = await encryptFile("x");

    expect(exitCode, stderr).toBe(0);
    expect(stderr).toContain(
      "⚠ Ledger Key Ring changed while this operation was running — the output above was produced " +
        "with a key from the ring as it was before that change.",
    );
    expect(existsSync(encFile)).toBe(true);
    expect(readSession(dir)).toEqual({ accounts: [], trustchain: ROTATED });
  });
});
