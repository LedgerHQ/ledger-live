import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import type { SessionEntry } from "../session/session-store";
import { stateHomeEnv, type StateHomeEnv } from "./state-home";

const SESSION_FILE = "session.yaml";

export function cliStateDirIn(stateHome: string): string {
  return stateDir(APP_NAME, {
    platform: process.platform,
    env: stateHomeEnv(stateHome),
    homedir: homedir(),
  });
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
  const appDir = cliStateDirIn(tmpDir);
  mkdirSync(appDir, { recursive: true });
  const sessionPath = join(appDir, SESSION_FILE);
  writeFileSync(sessionPath, YAML.stringify({ accounts: entries }));
  return {
    env: stateHomeEnv(tmpDir),
    sessionPath,
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}
