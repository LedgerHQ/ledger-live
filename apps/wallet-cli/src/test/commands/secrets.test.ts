import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { runCli, type RunResult } from "../helpers/cli-runner";

// Mock OS keychain so tests never touch macOS Keychain / libsecret.
// Must be declared before any runCli() call that triggers a keychain import.
const _store = new Map<string, string>();
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

const MOCK_ENV = { MOCK: "1" };
const MOCK_ENV_DMK = { ...MOCK_ENV, WALLET_CLI_MOCK_DMK: "1" };

function makeTmpDir(): { env: Record<string, string>; dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "wallet-cli-secrets-test-"));
  return {
    dir,
    env: { XDG_STATE_HOME: dir, ...MOCK_ENV },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

describe("secrets — not initialized", () => {
  const { env, cleanup } = makeTmpDir();
  afterAll(cleanup);

  it("keys exits 1", async () => {
    expect((await runCli(["secrets", "keys"], env)).exitCode).toBe(1);
  });

  it("encrypt exits 1", async () => {
    expect((await runCli(["secrets", "encrypt", "--key", "x"], env)).exitCode).toBe(1);
  });

  it("decrypt exits 1", async () => {
    expect((await runCli(["secrets", "decrypt", "--key", "x"], env)).exitCode).toBe(1);
  });

  it("destroy exits 1", async () => {
    expect((await runCli(["secrets", "destroy"], env)).exitCode).toBe(1);
  });
});

describe("secrets — happy path", () => {
  let dir: string;
  let env: Record<string, string>;
  let initResult: RunResult;
  let plainFile: string;
  let encFile: string;
  let decFile: string;

  beforeAll(async () => {
    ({ dir, env } = makeTmpDir());
    plainFile = join(dir, "plain.txt");
    encFile = join(dir, "test.enc");
    decFile = join(dir, "test.dec");
    await Bun.write(plainFile, "hello secrets");

    initResult = await runCli(["secrets", "init", "--name", "test-member"], {
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
    const r = await runCli(["secrets", "init"], { ...env, ...MOCK_ENV_DMK });
    expect(r.exitCode).toBe(1);
  });

  it("keys shows no domains after init", async () => {
    const r = await runCli(["secrets", "keys"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/no domain keys/i);
  });

  it("keys --output json returns empty keys array", async () => {
    const r = await runCli(["secrets", "keys", "--output", "json"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.command).toBe("secrets keys");
    expect(data.keys).toHaveLength(0);
  });

  it("encrypt writes ciphertext to file", async () => {
    const r = await runCli(
      ["secrets", "encrypt", "--key", "prod", "--input", plainFile, "--out", encFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const ct = await Bun.file(encFile).arrayBuffer();
    expect(ct.byteLength).toBeGreaterThan("hello secrets".length);
  });

  it("keys shows domain after encrypt", async () => {
    const r = await runCli(["secrets", "keys"], env);
    expect(r.exitCode, r.stderr).toBe(0);
    expect(r.stdout).toContain("prod");
  });

  it("encrypt --output json reports dest and bytes", async () => {
    const r = await runCli(
      ["secrets", "encrypt", "--key", "prod", "--input", plainFile, "--out", encFile, "--output", "json"],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.output).toBe(encFile);
    expect(data.bytes).toBeGreaterThan(0);
  });

  it("decrypt round-trips plaintext from file", async () => {
    const r = await runCli(
      ["secrets", "decrypt", "--key", "prod", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    expect(await Bun.file(decFile).text()).toBe("hello secrets");
  });

  it("decrypt --output json reports dest", async () => {
    const r = await runCli(
      ["secrets", "decrypt", "--key", "prod", "--input", encFile, "--out", decFile, "--output", "json"],
      env,
    );
    expect(r.exitCode, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.output).toBe(decFile);
  });

  it("decrypt with wrong domain key fails", async () => {
    const r = await runCli(
      ["secrets", "decrypt", "--key", "wrong", "--input", encFile, "--out", decFile],
      env,
    );
    expect(r.exitCode).toBe(1);
  });

  it("destroy wipes credentials after confirmation", async () => {
    const origDesc = Object.getOwnPropertyDescriptor(process, "stdin");
    const fakeStdin = new Readable({ read() {} });
    fakeStdin.push("destroy\n");
    fakeStdin.push(null);
    Object.defineProperty(process, "stdin", { get: () => fakeStdin, configurable: true });
    let r: RunResult;
    try {
      r = await runCli(["secrets", "destroy"], env);
    } finally {
      if (origDesc) Object.defineProperty(process, "stdin", origDesc);
    }
    expect(r!.exitCode, r!.stderr).toBe(0);
  });

  it("keys exits 1 after destroy", async () => {
    const r = await runCli(["secrets", "keys"], env);
    expect(r.exitCode).toBe(1);
  });
});
