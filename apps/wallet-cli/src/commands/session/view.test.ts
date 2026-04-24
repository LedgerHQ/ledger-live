import { describe, it, expect, afterEach } from "bun:test";
import { runLocalCli } from "../../test/helpers/cli-runner";
import { makeSessionDir } from "../../test/helpers/session-fixture";

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

let cleanup: (() => void) | undefined;
afterEach(() => { cleanup?.(); cleanup = undefined; });

describe("session view — human", () => {
  it("shows empty message when accounts list is empty", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runLocalCli(["session", "view"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/no accounts/i);
  });

  it("prints label and descriptor for each entry", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runLocalCli(["session", "view"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("bitcoin-native-1");
    expect(stdout).toContain("ethereum-1");
    expect(stdout).toContain("account:1:utxo:bitcoin:main");
    expect(stdout).toContain("account:1:address:ethereum:main");
  });

  it("shows all entries on separate lines", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runLocalCli(["session", "view"], fixture.env);
    expect(exitCode).toBe(0);
    const lines = stdout.split("\n").filter(Boolean);
    expect(lines).toHaveLength(SAMPLE_ENTRIES.length);
  });
});

describe("session view — json", () => {
  it("returns empty accounts array when session is empty", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runLocalCli(
      ["session", "view", "--output", "json"],
      fixture.env,
    );
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session view");
    expect(data.accounts).toEqual([]);
  });

  it("returns envelope with all account entries", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runLocalCli(
      ["session", "view", "--output", "json"],
      fixture.env,
    );
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session view");
    expect(data.accounts).toHaveLength(2);
    expect(data.accounts[0]).toEqual(SAMPLE_ENTRIES[0]);
    expect(data.accounts[1]).toEqual(SAMPLE_ENTRIES[1]);
  });

  it("includes timestamp in envelope", async () => {
    const fixture = makeSessionDir(SAMPLE_ENTRIES);
    cleanup = fixture.cleanup;
    const { stdout } = await runLocalCli(
      ["session", "view", "--output", "json"],
      fixture.env,
    );
    const data = JSON.parse(stdout);
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
