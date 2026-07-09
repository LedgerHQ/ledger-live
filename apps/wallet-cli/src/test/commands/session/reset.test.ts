import { describe, it, expect, afterEach } from "bun:test";
import { join } from "node:path";
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { YAML } from "bun";
import { runCli } from "../../helpers/cli-runner";
import { makeSessionDir } from "../../helpers/session-fixture";

const SAMPLE_ENTRIES = [
  {
    label: "bitcoin-native-1",
    descriptor: "account:1:utxo:bitcoin:main:xpub6BosfCnifzxcA:m/84h/0h/0h",
  },
  {
    label: "ethereum-1",
    descriptor:
      "account:1:address:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0",
  },
];

async function readSessionFile(xdgStateHome: string): Promise<unknown> {
  const path = join(xdgStateHome, "ledger-wallet-cli", "session.yaml");
  return YAML.parse(await Bun.file(path).text());
}

let cleanup: (() => void) | undefined;
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
});

describe("session reset — human", () => {
  it("reports empty when accounts list is already empty", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/already empty/i);
  });

  it("prints the count of removed accounts", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("2");
    expect(stdout).toMatch(/removed/i);
  });

  it("wipes accounts from the session file", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    await runCli(["session", "reset"], fixture.env);
    const session = await readSessionFile(fixture.env.XDG_STATE_HOME);
    expect(session).toEqual({ accounts: [] });
  });

  it("subsequent view shows empty session", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    await runCli(["session", "reset"], fixture.env);
    const { stdout, exitCode } = await runCli(["session", "view"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/no accounts/i);
  });
});

describe("session reset — json", () => {
  it("returns removed count of 0 when session is empty", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      ["session", "reset", "--output", "json"],
      fixture.env,
    );
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session reset");
    expect(data.removed).toBe(0);
  });

  it("returns correct removed count in envelope", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      ["session", "reset", "--output", "json"],
      fixture.env,
    );
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session reset");
    expect(data.removed).toBe(2);
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("wipes accounts from the session file", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    await runCli(["session", "reset", "--output", "json"], fixture.env);
    const session = await readSessionFile(fixture.env.XDG_STATE_HOME);
    expect(session).toEqual({ accounts: [] });
  });
});

describe("session reset — corrupt file recovery", () => {
  it("recovers an unreadable (non-YAML) session file into a clean empty session", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    writeFileSync(
      join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml"),
      ": : :\n\t- [", // not valid YAML → exercises the catch-branch fallback
    );
    const { exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).toBe(0);
    const session = await readSessionFile(fixture.env.XDG_STATE_HOME);
    expect(session).toEqual({ accounts: [] });
  });

  it("recovers a valid-YAML file with a malformed trustchain without throwing", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    // Malformed trustchain: readForReset salvages it to undefined without throwing.
    writeFileSync(
      join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml"),
      YAML.stringify({ accounts: [{ label: "bad label", descriptor: 42 }], trustchain: "nope" }),
    );
    const { exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).toBe(0);
    const session = await readSessionFile(fixture.env.XDG_STATE_HOME);
    expect(session).toEqual({ accounts: [] });
  });

  it("fails instead of silently wiping when the session file cannot be read", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    // Replace the session file with a directory at the same path: reading it throws an fs error
    // (EISDIR) with a `code`, which reset must surface rather than mask by overwriting.
    const path = join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml");
    rmSync(path);
    mkdirSync(path);
    const { exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).not.toBe(0);
  });

  it("preserves a valid trustchain across reset (clears accounts only, never wipes the ring)", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const trustchain = { rootId: "root-abc", applicationPath: "m/0'/17'/0'" };
    writeFileSync(
      join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml"),
      YAML.stringify({ accounts: SAMPLE_ENTRIES, trustchain, passwordSalt: "0".repeat(32) }),
    );
    const { exitCode } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode).toBe(0);
    const session = await readSessionFile(fixture.env.XDG_STATE_HOME);
    expect(session).toEqual({ accounts: [], trustchain, passwordSalt: "0".repeat(32) });
  });
});
