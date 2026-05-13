import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { YAML } from "bun";
import { APP_NAME } from "../../session/session-store";
import type { SessionEntry } from "../../session/session-store";

const SESSION_FILE = "session.yaml";

/**
 * Creates a temp XDG state dir pre-populated with session entries.
 * Pass { env } to the CLI subprocess — XDG_STATE_HOME redirects all session I/O there.
 * Call cleanup() in afterEach/afterAll to remove the temp dir.
 */
export function makeSessionDir(entries: SessionEntry[]): {
  env: { XDG_STATE_HOME: string };
  cleanup: () => void;
} {
  const tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
  const appDir = join(tmpDir, APP_NAME);
  mkdirSync(appDir);
  writeFileSync(join(appDir, SESSION_FILE), YAML.stringify({ accounts: entries }));
  return {
    env: { XDG_STATE_HOME: tmpDir },
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}
