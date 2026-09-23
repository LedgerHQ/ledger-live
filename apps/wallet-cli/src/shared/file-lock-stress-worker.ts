// Spawned as a real, separate OS process by file-lock.test.ts's multi-process stress test — NOT a
// test itself. In-process tests can't falsify a cross-process lock (every lock they take has the
// same, live pid), so this exercises the real thing: many actual processes racing `withFileLock`
// on one shared lock file, each appending its own enter/exit to one shared, append-only log so the
// test can check afterwards that no two processes were ever inside the critical section together.
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import { randomInt } from "node:crypto";
import { withFileLock } from "./file-lock";

// This script only ever runs as a test fixture, spawned by file-lock.test.ts with paths it built
// itself from mkdtempSync(tmpdir()) — but it takes those paths as argv, so require them to resolve
// inside the temp dir regardless, rather than trusting argv at face value. Not realpath-resolved:
// mkdtempSync(tmpdir()) in the test isn't either, and resolving through a symlinked tmpdir (e.g.
// macOS /tmp -> /private/tmp) here but not there would make this reject the test's own paths.
const TMP_ROOT = resolve(tmpdir());

function requireInsideTmpDir(path: string, label: string): string {
  const resolved = resolve(path);
  if (resolved !== TMP_ROOT && !resolved.startsWith(TMP_ROOT + sep)) {
    throw new Error(`${label} must resolve inside ${TMP_ROOT}, got ${resolved}`);
  }
  return resolved;
}

const [, , rawLockPath, rawLogPath, iterationsArg] = process.argv;
const lockPath = requireInsideTmpDir(rawLockPath, "lockPath");
const logPath = requireInsideTmpDir(rawLogPath, "logPath");
const iterations = Number(iterationsArg);

function log(line: string): void {
  appendFileSync(logPath, `${line}\n`);
}

async function main(): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    await withFileLock(lockPath, async () => {
      log(`enter:${process.pid}`);
      await new Promise(resolve => setTimeout(resolve, randomInt(15)));
      log(`exit:${process.pid}`);
    });
  }
}

await main();
