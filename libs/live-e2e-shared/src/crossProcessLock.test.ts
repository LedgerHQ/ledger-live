import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync } from "node:fs";
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

test("keeps a key closed for the settle window its holder released it with", async () => {
  const rootDir = createRootDir();
  const release = await acquireCrossProcessLock("key", { rootDir });
  const releasedAt = Date.now();
  await release(200);

  const next = await acquireCrossProcessLock("key", { rootDir, backoffMs: 5 });

  assert.ok(Date.now() - releasedAt >= 190);
  await next();
  rmSync(rootDir, { recursive: true, force: true });
});

test("hands a key back at once when released without a settle window", async () => {
  const rootDir = createRootDir();
  await (
    await acquireCrossProcessLock("key", { rootDir })
  )();

  const next = await acquireCrossProcessLock("key", { rootDir, acquireTimeoutMs: 0 });

  await next();
  rmSync(rootDir, { recursive: true, force: true });
});

test("times out instead of waiting out a settle window longer than it may wait", async () => {
  const rootDir = createRootDir();
  await (
    await acquireCrossProcessLock("key", { rootDir })
  )(60_000);
  const [settleFile] = readdirSync(rootDir);

  await assert.rejects(
    acquireCrossProcessLock("key", { rootDir, acquireTimeoutMs: 50, backoffMs: 5 }),
    /timed out/,
  );

  assert.deepEqual(readdirSync(rootDir), [settleFile]);
  rmSync(rootDir, { recursive: true, force: true });
});

test("holds a key for its settle window when it cannot leave the window behind", async () => {
  const rootDir = createRootDir();
  const release = await acquireCrossProcessLock("key", { rootDir });
  const [lockName] = readdirSync(rootDir);
  mkdirSync(path.join(rootDir, `${lockName}.settled-until`));

  const releasing = release(200);
  await assert.rejects(
    acquireCrossProcessLock("key", { rootDir, acquireTimeoutMs: 50, backoffMs: 5 }),
    /timed out/,
  );
  await releasing;

  assert.ok(!readdirSync(rootDir).includes(lockName));
  rmSync(rootDir, { recursive: true, force: true });
});
