import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import {
  agentIntentKeyFilePath,
  deleteAgentIntentKeyFile,
  hasAgentIntentKeyFile,
  loadAgentIntentKeyFile,
  saveAgentIntentKeyFile,
} from "./agent-intent-key-file";

const origStateHome = process.env.XDG_STATE_HOME;
let stateHome: string;

const mode = (p: string) => statSync(p).mode & 0o777;

beforeEach(() => {
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-agent-key-file-"));
  process.env.XDG_STATE_HOME = stateHome;
});

afterEach(() => {
  rmSync(stateHome, { recursive: true, force: true });
  if (origStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = origStateHome;
});

describe("agent-intent key file", () => {
  it("lives under the state dir's agent-intent-keys directory, named by profile id", () => {
    expect(agentIntentKeyFilePath("bot")).toBe(
      join(stateHome, "ledger-wallet-cli", "agent-intent-keys", "bot.key"),
    );
  });

  it("writes the key at 0600 inside a 0700 directory and reads it back", () => {
    saveAgentIntentKeyFile("bot", "deadbeef");

    const path = agentIntentKeyFilePath("bot");
    expect(mode(path)).toBe(0o600);
    expect(mode(dirname(path))).toBe(0o700);
    expect(loadAgentIntentKeyFile("bot")).toBe("deadbeef");
    expect(hasAgentIntentKeyFile("bot")).toBe(true);
  });

  it("tightens an existing key directory to 0700", () => {
    const dir = dirname(agentIntentKeyFilePath("bot"));
    mkdirSync(dir, { recursive: true });
    chmodSync(dir, 0o755);

    saveAgentIntentKeyFile("bot", "deadbeef");

    expect(mode(dir)).toBe(0o700);
  });

  it("tolerates a trailing newline added by hand", () => {
    saveAgentIntentKeyFile("bot", "deadbeef");
    writeFileSync(agentIntentKeyFilePath("bot"), "deadbeef\r\n");

    expect(loadAgentIntentKeyFile("bot")).toBe("deadbeef");
  });

  it("returns null and reports absence when no file exists", () => {
    expect(loadAgentIntentKeyFile("bot")).toBeNull();
    expect(hasAgentIntentKeyFile("bot")).toBe(false);
  });

  it("treats deleting a missing file as success and removes an existing one", () => {
    expect(deleteAgentIntentKeyFile("bot")).toBe(true);

    saveAgentIntentKeyFile("bot", "deadbeef");
    expect(deleteAgentIntentKeyFile("bot")).toBe(true);
    expect(hasAgentIntentKeyFile("bot")).toBe(false);
  });
});
