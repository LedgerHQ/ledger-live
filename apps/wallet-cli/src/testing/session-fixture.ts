import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { YAML } from "bun";
import type { SessionEntry } from "../session/session-store";
import { cliStateDirIn, stateHomeEnv, type StateHomeEnv } from "./state-home";

const SESSION_FILE = "session.yaml";

export function writeSessionIn(stateHome: string, session: Record<string, unknown>): string {
  const sessionPath = join(cliStateDirIn(stateHome), SESSION_FILE);
  mkdirSync(dirname(sessionPath), { recursive: true });
  writeFileSync(sessionPath, YAML.stringify(session));
  return sessionPath;
}

/**
 * Creates a temp state dir pre-populated with session entries.
 * Pass { env } to the CLI — it points the state dir there on every platform.
 * Call cleanup() in afterEach/afterAll to remove the temp dir.
 */
export function makeSessionDir(entries: SessionEntry[]): {
  env: StateHomeEnv;
  sessionPath: string;
  cleanup: () => void;
} {
  const tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
  return {
    env: stateHomeEnv(tmpDir),
    sessionPath: writeSessionIn(tmpDir, { accounts: entries }),
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}
