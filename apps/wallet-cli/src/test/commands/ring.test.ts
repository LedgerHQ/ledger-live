import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { YAML } from "bun";
import { runCli, type RunResult } from "../helpers/cli-runner";

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

// Mock OS keychain so tests never touch macOS Keychain / libsecret.
// Must be installed before any runCli() call that triggers a keychain import.
const _store = new Map<string, string>();
function installKeychainMock(): void {
  mock.module("@napi-rs/keyring", () => ({
    Entry: class {
      #k: string;
      constructor(svc: string, acc: string) {
        this.#k = `${svc}:${acc}`;
      }
      setPassword(v: string) {
        _store.set(this.#k, v);
      }
      getPassword() {
        return _store.get(this.#k) ?? null;
      }
      deletePassword() {
        _store.delete(this.#k);
      }
    },
  }));
}
installKeychainMock();
// Final cleanup after the whole file, so neither the keychain mock nor any per-test module mock
// leaks into other test files sharing this process.
afterAll(() => mock.restore());

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

  beforeAll(async () => {
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

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

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
    const r = await runCli(
      ["ring", "encrypt", "--key", "prod", "--input", plainFile, "--out", encFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const ct = await Bun.file(encFile).arrayBuffer();
    expect(ct.byteLength).toBeGreaterThan("hello key ring".length);
  });

  it("encrypt writes the output file with 0600 permissions", () => {
    expect(statSync(encFile).mode & 0o777).toBe(0o600);
  });

  it("keys shows key after encrypt", async () => {
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
    const r = await runCli(
      ["ring", "decrypt", "--key", "prod", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    expect(await Bun.file(decFile).text()).toBe("hello key ring");
  });

  it("decrypt --output json reports dest", async () => {
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
    const r = await runCli(
      ["ring", "decrypt", "--key", "wrong", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode).toBe(1);
  });

  it("destroy wipes credentials after confirmation", async () => {
    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
  });

  it("keys exits 1 after destroy", async () => {
    const r = await runCli(["ring", "keys"], env);
    expect(r.exitCode).toBe(1);
  });
});

describe("ring — with password", () => {
  let dir: string;
  let env: Record<string, string>;
  let plainFile: string;
  let encFile: string;

  beforeAll(async () => {
    _store.clear();
    ({ dir, env } = makeTmpDir());
    plainFile = join(dir, "plain.txt");
    encFile = join(dir, "test.enc");
    await Bun.write(plainFile, "hello password");
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("init stores password-wrapped key", async () => {
    const r = await runCli(["ring", "init", "--name", "pw-member"], {
      ...env,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "testpw",
    });
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).toContain("pw-member");
  });

  it("init rejects empty password", async () => {
    const { dir: d2, env: e2 } = makeTmpDir();
    const r = await runCli(["ring", "init", "--name", "pw-member", "--output", "json"], {
      ...e2,
      ...MOCK_ENV_DMK,
      WALLET_PASS: "",
    });
    rmSync(d2, { recursive: true, force: true });
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/must not be empty/i);
  });

  it("keychain stores encrypted private key", () => {
    const allValues = [..._store.values()];
    expect(allValues.some(v => v.startsWith("ENC:"))).toBe(true);
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
    const r = await runCliWithStdin(["ring", "destroy"], { ...env, WALLET_PASS: "wrongpw" }, [
      "destroy",
    ]);
    expect(r.exitCode).toBe(1);
    // `ring keys` still succeeds → the ring was not wiped.
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode, keys.stderr).toBe(0);
  });

  it("destroy with an empty WALLET_PASS aborts without wiping the ring", async () => {
    // Empty WALLET_PASS is a mistake (failed substitution), not a skip.
    const r = await runCliWithStdin(["ring", "destroy"], { ...env, WALLET_PASS: "" }, ["destroy"]);
    expect(r.exitCode).toBe(1);
    const keys = await runCli(["ring", "keys"], env);
    expect(keys.exitCode, keys.stderr).toBe(0);
  });

  it("destroy with correct password fully destroys the ring", async () => {
    const r = await runCliWithStdin(["ring", "destroy"], { ...env, WALLET_PASS: "testpw" }, [
      "destroy",
    ]);
    expect(r.exitCode, r.stderr).toBe(0);
  });

  it("keys exits 1 after destroy", async () => {
    const r = await runCli(["ring", "keys"], env);
    expect(r.exitCode).toBe(1);
  });
});

describe("ring — uninitialized with a stray password-protected key", () => {
  const { dir, cleanup } = makeTmpDir();
  afterAll(cleanup);

  // Asserted at unit level because Bunli prints a plain Error to the real stderr, which runCli's
  // output capture does not observe.
  it("throws 'not initialized' rather than a password error", async () => {
    // Dynamic import: static imports hoist above the mock.module() call above and defeat the mock.
    const { savePrivateKey } = await import("../../key-ring/keychain");
    const { deriveWrappingKey } = await import("../../key-ring/crypto");
    const { loadKeyRing } = await import("../../key-ring/load-key-ring");

    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir; // pin the session dir + keychain account to this temp dir
    try {
      _store.clear();
      const wrappingKey = await deriveWrappingKey("pw", "0".repeat(32));
      await savePrivateKey("aa".repeat(32), "bb".repeat(33), wrappingKey);

      // No `ring init` ran, so there is no trustchain on disk.
      await expect(loadKeyRing()).rejects.toThrow(/not initialized/i);
      await expect(loadKeyRing()).rejects.not.toThrow(/password/i);
    } finally {
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
    }
  });
});

describe("ring init — orphan guard", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("refuses to init over a stray keychain key when the session has no trustchain", async () => {
    const { savePrivateKey } = await import("../../key-ring/keychain");
    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir; // pin the keychain account to this temp dir
    try {
      _store.clear();
      await savePrivateKey("aa".repeat(32), "bb".repeat(33)); // stray key, no trustchain on disk
    } finally {
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
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
    const { savePrivateKey, loadMemberCredentials } = await import("../../key-ring/keychain");

    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir;
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
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
    }
  });
});

describe("ring — password-protected keychain entry decode errors", () => {
  const { dir, cleanup } = makeTmpDir();
  afterAll(cleanup);

  async function withStateDir<T>(fn: () => Promise<T>): Promise<T> {
    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir; // pin the keychain account to this temp dir
    try {
      return await fn();
    } finally {
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
    }
  }

  it("reports corruption (not a wrong password) for a non-hex ENC payload", async () => {
    const { savePrivateKey, loadMemberCredentials } = await import("../../key-ring/keychain");
    const { deriveWrappingKey } = await import("../../key-ring/crypto");
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
    const { savePrivateKey, loadMemberCredentials } = await import("../../key-ring/keychain");
    const { deriveWrappingKey } = await import("../../key-ring/crypto");
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
    const { savePrivateKey } = await import("../../key-ring/keychain");
    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir; // pin the keychain account to this temp dir
    try {
      await savePrivateKey("aa".repeat(32), "bb".repeat(33)); // stray key, no trustchain on disk
    } finally {
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
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
    const sessionPath = join(dir, "ledger-wallet-cli", "session.yaml");
    mkdirSync(dirname(sessionPath), { recursive: true });
    writeFileSync(sessionPath, YAML.stringify({ accounts: [], passwordSalt: "0".repeat(32) }));

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
  afterAll(() => {
    // Undo this block's lkrp-sdk module mock. mock.restore() is all-or-nothing, so it also drops the
    // file-wide keychain mock — re-install it so the suite doesn't depend on this block running last.
    mock.restore();
    installKeychainMock();
    cleanup();
  });

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
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        destroyApplication: async () => {
          throw new Error("network down");
        },
      }),
    }));

    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode).toBe(1);
    expect([..._store.values()]).toEqual(before); // key kept — no orphaning on a transient failure
  });
});

// The runner shares one in-process module graph across tests (see cli-runner.ts), and an lkrp-sdk
// `mock.module` from an earlier block stays registered here — so a real `ring init` would use the
// mocked SDK and fail. We therefore seed the initialized ring state (session + keychain) directly
// and mock only the SDK method under test.
async function seedInitializedRing(dir: string): Promise<void> {
  const sessionPath = join(dir, "ledger-wallet-cli", "session.yaml");
  mkdirSync(dirname(sessionPath), { recursive: true });
  writeFileSync(
    sessionPath,
    YAML.stringify({
      accounts: [],
      trustchain: { rootId: "seed-root", applicationPath: "m/0'/17'/0'" },
    }),
  );
  // savePrivateKey hashes the account name from XDG_STATE_HOME, so pin it to this temp dir (matching
  // the env passed to runCli) before saving.
  const { savePrivateKey } = await import("../../key-ring/keychain");
  const saved = process.env.XDG_STATE_HOME;
  process.env.XDG_STATE_HOME = dir;
  try {
    await savePrivateKey("aa".repeat(32), "bb".repeat(33));
  } finally {
    if (saved === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = saved;
  }
}

describe("ring destroy — ejected member wipes locally", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(() => {
    // See the transient-failure block: mock.restore() is all-or-nothing, so re-install the file-wide
    // keychain mock afterwards.
    mock.restore();
    installKeychainMock();
    cleanup();
  });

  it("treats TrustchainEjected as remote-already-gone and wipes the key (exit 0)", async () => {
    _store.clear();
    await seedInitializedRing(dir);
    expect([..._store.values()]).toHaveLength(1);

    // destroyApplication is idempotent on an already-closed stream (returns without throwing), so
    // TrustchainEjected means this member is no longer on the ring (removed by another owner, or the
    // trustchain was destroyed remotely): the remote is gone for us, so destroy should proceed to the
    // local wipe rather than abort.
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        destroyApplication: async () => {
          throw new TrustchainEjected("not a member of trustchain");
        },
      }),
    }));

    const r = await runCliWithStdin(["ring", "destroy"], env, ["destroy"]);
    expect(r.exitCode, r.stderr).toBe(0);
    expect([..._store.values()]).toHaveLength(0); // key wiped despite the remote being already gone
    expect(r.stdout).toMatch(/no longer a member/i);
  });
});

describe("ring encrypt/decrypt — closed application stream gives reactivation guidance", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(() => {
    mock.restore();
    installKeychainMock();
    cleanup();
  });

  // Asserted at unit level (like the "stray password-protected key" block above): Bunli prints the
  // command Error to the real stderr, which runCli's output capture does not observe.
  it("loadDomainKey rethrows an ejected stream as actionable guidance", async () => {
    _store.clear();
    await seedInitializedRing(dir);

    // The application was deactivated on the ring elsewhere: restoreTrustchain rejects a closed stream.
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        restoreTrustchain: async () => {
          throw new TrustchainEjected("application stream is closed");
        },
      }),
    }));
    // Dynamic import so the mock above is in effect (a static import would hoist above it).
    const { loadDomainKey } = await import("../../key-ring/load-key-ring");

    const saved = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = dir; // pin the session dir + keychain account to this temp dir
    try {
      await expect(loadDomainKey("mykey")).rejects.toThrow(/deactivated/i);
      await expect(loadDomainKey("mykey")).rejects.toThrow(/ring init/i);
    } finally {
      if (saved === undefined) delete process.env.XDG_STATE_HOME;
      else process.env.XDG_STATE_HOME = saved;
    }
  });

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
    // This pins the failure below to the ejection — Bunli prints the command Error to the real stderr
    // (not captured by runCli), so exit code + file side effect are all we can observe at CLI level.
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        restoreTrustchain: async () => ({
          rootId: "seed-root",
          applicationPath: "m/0'/17'/0'", // matches the seed → no rotation warning
          walletSyncEncryptionKey: "00".repeat(32),
        }),
      }),
    }));
    const ok = await runCli(encryptArgs, env);
    expect(ok.exitCode, ok.stderr).toBe(0);
    expect(existsSync(outFile)).toBe(true);

    // Now the stream is ejected: the same command must fail and must NOT leave ciphertext behind.
    rmSync(outFile, { force: true });
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        restoreTrustchain: async () => {
          throw new TrustchainEjected("application stream is closed");
        },
      }),
    }));
    const r = await runCli(encryptArgs, env);
    expect(r.exitCode).toBe(1);
    expect(existsSync(outFile)).toBe(false); // aborted before writing ciphertext
  });
});

describe("ring destroy — non-destructive deactivation keeps the ring but wipes locally", () => {
  const { dir, env, cleanup } = makeTmpDir();
  afterAll(() => {
    mock.restore();
    installKeychainMock();
    cleanup();
  });

  it("reports the app was deactivated (kept for other apps), wipes locally, and unblocks re-init", async () => {
    _store.clear();
    await seedInitializedRing(dir);

    // Non-destructive close: destroyApplication closes only the wallet-cli stream (the trustchain is
    // kept for other applications), so trustchainDestroyed is false.
    mock.module("../../key-ring/lkrp-sdk", () => ({
      createLkrpSdk: () => ({
        destroyApplication: async () => ({ trustchainDestroyed: false }),
      }),
    }));
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
