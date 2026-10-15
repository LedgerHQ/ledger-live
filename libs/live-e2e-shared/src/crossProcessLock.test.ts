import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, utimesSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { acquireCrossProcessLock } from "./crossProcessLock";

const createRootDir = () => mkdtempSync(path.join(os.tmpdir(), "cross-process-lock-"));

test("waits for a lock its holder keeps fresh", async () => {
  const rootDir = createRootDir();
  const release = await acquireCrossProcessLock("key", { rootDir });

  await assert.rejects(
    acquireCrossProcessLock("key", { rootDir, acquireTimeoutMs: 50, backoffMs: 5 }),
    /timed out/,
  );

  await release();
  rmSync(rootDir, { recursive: true, force: true });
});

test("takes over a lock whose holder stopped refreshing it, leaving nothing behind", async () => {
  const rootDir = createRootDir();
  await acquireCrossProcessLock("key", { rootDir, heartbeatMs: 60_000 });
  const [lockName] = readdirSync(rootDir);
  const longAgo = new Date(Date.now() - 60_000);
  utimesSync(path.join(rootDir, lockName), longAgo, longAgo);

  const release = await acquireCrossProcessLock("key", { rootDir, staleMs: 30_000, backoffMs: 5 });

  assert.deepEqual(readdirSync(rootDir), [lockName]);
  await release();
  rmSync(rootDir, { recursive: true, force: true });
});
