// Persists a single per-user marker so the first-run nudge is shown at most once.
// Mirrors session-store.ts: stateDir(APP_NAME) honors XDG_STATE_HOME. All fs
// access is best-effort — read-only or otherwise hostile environments must never
// cause the CLI to throw or change its exit code.

import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { APP_NAME } from "../session/session-store";
import { CLI_VERSION } from "../skills/registry";

const MARKER_FILE = "first-run.json";

function markerPath(): string {
  return join(stateDir(APP_NAME), MARKER_FILE);
}

/** True when the nudge marker already exists. Returns false on any error. */
export function hasNudgeBeenShown(): boolean {
  try {
    return existsSync(markerPath());
  } catch {
    return false;
  }
}

/** Record that the nudge has been shown. Swallows all fs errors (never throws). */
export function markNudgeShown(): void {
  try {
    const dir = stateDir(APP_NAME);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    chmodSync(dir, 0o700); // enforce on existing dirs created by prior versions (mirrors session-store)
    writeFileSync(
      join(dir, MARKER_FILE),
      `${JSON.stringify({ nudgeShownAt: new Date().toISOString(), version: CLI_VERSION }, null, 2)}\n`,
      { mode: 0o600 },
    );
  } catch {
    // Read-only or unwritable state dir — the nudge may re-appear next run, which
    // is acceptable and strictly better than failing the command.
  }
}
