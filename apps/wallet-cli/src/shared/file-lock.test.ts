import { describe, it, expect, afterEach } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withFileLock } from "./file-lock";

let dir: string | undefined;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function lockPath(): string {
  dir = mkdtempSync(join(tmpdir(), "file-lock-test-"));
  return join(dir, ".test.lock");
}

/**
 * A pid this test can treat as dead. Spawns a process, waits for it to exit, then re-checks
 * liveness immediately before returning — Windows can reuse a pid right after exit, and this
 * narrows (without eliminating) the window where that reuse would land on a pid some unrelated
 * live process now holds. If this ever proves flaky in practice, the fix is a longer-lived
 * confirmation (e.g. polling `tasklist`), not a bigger sleep.
 */
function deadPid(): number {
  const proc = Bun.spawnSync([process.execPath, "-e", ""]);
  try {
    process.kill(proc.pid, 0);
    throw new Error(`pid ${proc.pid} did not die in time for this test`);
  } catch (e) {
    if ((e as { code?: string } | null)?.code !== "ESRCH") throw e;
  }
  return proc.pid;
}

describe("withFileLock", () => {
  it("runs fn and returns its result", async () => {
    const result = await withFileLock(lockPath(), () => 42);
    expect(result).toBe(42);
  });

  it("removes the lock file after fn resolves", async () => {
    const path = lockPath();
    await withFileLock(path, () => "done");
    expect(existsSync(path)).toBe(false);
  });

  it("removes the lock file even when fn throws", async () => {
    const path = lockPath();
    const boom = new Error("boom");
    await expect(
      withFileLock(path, () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
    expect(existsSync(path)).toBe(false);
  });

  it("leaves no leftover temp file in the directory either way", async () => {
    const path = lockPath();
    await withFileLock(path, () => "done");
    await expect(withFileLock(path, () => Promise.reject(new Error("boom")))).rejects.toThrow();
    expect(readdirSync(dir!)).toEqual([]);
  });

  it("serializes two concurrent acquisitions of the same path", async () => {
    const path = lockPath();
    const events: string[] = [];

    const first = withFileLock(path, async () => {
      events.push("first-start");
      await new Promise(resolve => setTimeout(resolve, 100));
      events.push("first-end");
    });
    const second = withFileLock(path, () => {
      events.push("second-start");
    });

    await Promise.all([first, second]);
    expect(events).toEqual(["first-start", "first-end", "second-start"]);
  });

  it("steals a lock left behind by a dead process instead of waiting forever", async () => {
    const path = lockPath();
    // A validly-*shaped* token (this module's own 16-hex-char nonce format) — this test is about
    // pid-liveness specifically, kept distinct from the malformed-token tests further down.
    writeFileSync(path, `${deadPid()}:a1b2c3d4e5f60718`);

    const result = await withFileLock(path, () => "acquired");
    expect(result).toBe("acquired");
  });

  it("never steals a lock held by a live process, even if fn runs long", async () => {
    const path = lockPath();
    // A long-lived process, not this test's own pid (which withFileLock would treat as alive
    // trivially — the point is proving liveness is checked by asking the OS, not assumed). A
    // validly-*shaped* token, same reasoning as the dead-process test above.
    const holder = Bun.spawn([process.execPath, "-e", "await new Promise(() => {})"]);
    writeFileSync(path, `${holder.pid}:a1b2c3d4e5f60718`);

    try {
      // Short acquire timeout — this test is about the "give up and report" path, not about
      // proving it waits the full production default.
      await expect(withFileLock(path, () => "should not run", 300)).rejects.toThrow(
        /Timed out waiting for a lock/,
      );
    } finally {
      holder.kill();
    }
  });

  it("releases only its own token, never a lock some other holder currently owns", async () => {
    const path = lockPath();
    // Simulate: this call's lock got stolen (as abandoned) by another process after acquisition,
    // which wrote its own token in its place. Release must not delete that legitimate new lock.
    await withFileLock(path, () => {
      writeFileSync(path, `${process.pid}:someone-elses-token`);
    });
    expect(readFileSync(path, "utf8")).toBe(`${process.pid}:someone-elses-token`);
  });

  it("treats a malformed (but externally-corrupted, not race-created) lock file as abandoned", async () => {
    const path = lockPath();
    // Written directly, not via withFileLock's own write-then-link — simulates hand corruption or a
    // foreign writer, not the empty-file-in-flight window that write-then-link exists to prevent.
    writeFileSync(path, "not a valid token at all");

    const result = await withFileLock(path, () => "acquired");
    expect(result).toBe("acquired");
  });

  it("treats a bare-pid token (no nonce) as abandoned even when that pid happens to be alive", async () => {
    const path = lockPath();
    // This test's own pid is guaranteed alive — proving a malformed token isn't treated as a real
    // live holder just because its pid prefix happens to match some unrelated running process.
    writeFileSync(path, `${process.pid}`);

    const result = await withFileLock(path, () => "acquired");
    expect(result).toBe("acquired");
  });

  it("treats a pid-plus-non-hex-trailer token as abandoned too, not just a bare pid", async () => {
    const path = lockPath();
    // A colon followed by *something* non-empty isn't enough to count as a real nonce — it must be
    // this module's own 16-hex-char shape, or a value like this (this test's own, guaranteed-alive
    // pid, plus an arbitrary trailer) would otherwise wrongly read as a live holder.
    writeFileSync(path, `${process.pid}:not-a-nonce`);

    const result = await withFileLock(path, () => "acquired");
    expect(result).toBe("acquired");
  });

  // In-process tests above can't falsify a cross-process lock — every lock they take has the same,
  // live pid, so none of them can exercise the empty-lock window or the steal-race that findings 1
  // and 2 of the 2026-09-23 review were about. This is the adversarial version: real, separate OS
  // processes racing the real lock, logging every enter/exit to one shared append-only file.
  it("holds mutual exclusion across real, separate processes", async () => {
    const path = lockPath();
    const logPath = join(dir!, "log.txt");
    writeFileSync(logPath, "");
    const workerPath = join(import.meta.dir, "file-lock-stress-worker.ts");

    const workerCount = 4;
    const iterationsPerWorker = 5;
    const workers = Array.from({ length: workerCount }, () =>
      Bun.spawn([process.execPath, "run", workerPath, path, logPath, String(iterationsPerWorker)], {
        stdout: "inherit",
        stderr: "inherit",
      }),
    );
    const exitCodes = await Promise.all(workers.map(w => w.exited));
    expect(exitCodes).toEqual(Array(workerCount).fill(0));

    const lines = readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
    expect(lines.length).toBe(workerCount * iterationsPerWorker * 2); // one enter + one exit each

    let concurrentHolders = 0;
    let maxConcurrentHolders = 0;
    for (const line of lines) {
      concurrentHolders += line.startsWith("enter:") ? 1 : -1;
      maxConcurrentHolders = Math.max(maxConcurrentHolders, concurrentHolders);
    }
    expect(maxConcurrentHolders).toBe(1);
    expect(concurrentHolders).toBe(0); // every enter had a matching exit
  }, 10_000);
});
