import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import type { SessionEntry } from "../session/session-store";
import { stateHomeEnv } from "./state-home";

const SESSION_FILE = "session.yaml";

export function cliStateDirIn(stateHome: string): string {
  return stateDir(APP_NAME, {
    platform: process.platform,
    env: stateHomeEnv(stateHome),
    homedir: homedir(),
  });
}

/**
 * Creates a temp XDG state dir pre-populated with session entries.
 * Pass { env } to the CLI subprocess — XDG_STATE_HOME redirects all session I/O there.
 * Call cleanup() in afterEach/afterAll to remove the temp dir.
 */
export function makeSessionDir(entries: SessionEntry[]): {
  env: { XDG_STATE_HOME: string };
  sessionPath: string;
  cleanup: () => void;
} {
  const tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
  const appDir = cliStateDirIn(tmpDir);
  mkdirSync(appDir, { recursive: true });
  const sessionPath = join(appDir, SESSION_FILE);
  writeFileSync(sessionPath, YAML.stringify({ accounts: entries }));
  return {
    env: { XDG_STATE_HOME: tmpDir },
    sessionPath,
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}
