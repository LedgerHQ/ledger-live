import assert from "node:assert/strict";
import test from "node:test";
import { ExclusiveLockStoreFatalError } from "../errors";
import { acquireDistributedLock, type DistributedLockOptions } from "./distributedLock";
import type { AbandonableLease, LockRecord, LockStore, StoredLock } from "./types";

type Clock = { now: number };

class MemoryLockStore implements LockStore {
  readonly objects = new Map<string, { record: LockRecord; etag: string; modifiedAt: number }>();
  failuresLeft = 0;
  failure: Error = new Error("R2 unavailable");
  commitThenFailNextWrite = false;
  private version = 0;

  constructor(private readonly clock: Clock) {}

  async read(key: string): Promise<StoredLock | undefined> {
    this.failIfScheduled();
    const object = this.objects.get(key);
    if (!object) return undefined;
    return { record: object.record, etag: object.etag, ageMs: this.clock.now - object.modifiedAt };
  }

  async create(key: string, record: LockRecord) {
    this.failIfScheduled();
    if (this.objects.has(key)) return undefined;
    return this.write(key, record);
  }

  async replace(key: string, record: LockRecord, etag: string) {
    this.failIfScheduled();
    if (this.objects.get(key)?.etag !== etag) return undefined;
    return this.write(key, record);
  }

  releaseAsAnotherHolder(key: string) {
    this.write(key, {
      holder: "rival",
      label: "rival",
      leaseMs: 60_000,
      settleMs: 0,
      released: true,
    });
  }

  overwriteAsAnotherHolder(key: string) {
    this.write(key, {
      holder: "intruder",
      label: "intruder",
      leaseMs: 60_000,
      settleMs: 0,
      released: false,
    });
  }

  private write(key: string, record: LockRecord) {
    const etag = `"v${++this.version}"`;
    this.objects.set(key, { record, etag, modifiedAt: this.clock.now });
    if (this.commitThenFailNextWrite) {
      this.commitThenFailNextWrite = false;
      throw new Error("socket hang up");
    }
    return etag;
  }

  private failIfScheduled() {
    if (this.failuresLeft > 0) {
      this.failuresLeft--;
      throw this.failure;
    }
  }
}

class ContestedLockStore extends MemoryLockStore {
  rivalWinsLeft = 0;

  override async replace(key: string, record: LockRecord, etag: string) {
    if (this.rivalWinsLeft === 0) return super.replace(key, record, etag);
    this.rivalWinsLeft--;
    this.releaseAsAnotherHolder(key);
    return undefined;
  }
}

class FrozenAgeLockStore extends MemoryLockStore {
  override async read(key: string): Promise<StoredLock | undefined> {
    const stored = await super.read(key);
    return stored && { ...stored, ageMs: 44_000 };
  }
}

class ClaimedRightAfterReadLockStore extends MemoryLockStore {
  override async read(key: string): Promise<StoredLock | undefined> {
    const stored = await super.read(key);
    this.overwriteAsAnotherHolder(key);
    return stored;
  }
}

class EveryOtherCreateFailsLockStore extends MemoryLockStore {
  private creates = 0;

  override async create(key: string, record: LockRecord) {
    this.creates++;
    if (this.creates % 2 === 1) throw new Error("R2 unavailable");
    return super.create(key, record);
  }
}

class WeakEtagLockStore extends MemoryLockStore {
  override async read(key: string): Promise<StoredLock | undefined> {
    const stored = await super.read(key);
    return stored && { ...stored, etag: `W/${stored.etag}` };
  }
}

const createLogger = () => {
  const infos: string[] = [];
  const warnings: string[] = [];
  return {
    infos,
    warnings,
    log: {
      info: (message: string) => infos.push(message),
      warn: (message: string) => warnings.push(message),
    },
  };
};

const options = (
  clock: Clock,
  holder: string,
  overrides: Partial<DistributedLockOptions> = {},
): DistributedLockOptions => ({
  holder,
  label: `${holder} spec`,
  leaseMs: 60_000,
  settleMs: 0,
  heartbeatMs: 20_000,
  pollMs: 1_000,
  acquireTimeoutMs: 600_000,
  log: createLogger().log,
  now: () => clock.now,
  sleep: async ms => {
    clock.now += ms;
  },
  random: () => 0,
  ...overrides,
});

const flushTimers = () => new Promise(resolve => setTimeout(resolve, 30));

test("acquires a free account immediately and hands it to the next holder once released", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);

  const first = await acquireDistributedLock(
    store,
    "ethereum:44'/60'/0'/0/0",
    options(clock, "ios"),
  );
  await first.release();
  const second = await acquireDistributedLock(
    store,
    "ethereum:44'/60'/0'/0/0",
    options(clock, "android", { acquireTimeoutMs: 0 }),
  );
  await second.release();

  assert.equal(store.objects.get("ethereum:44'/60'/0'/0/0")?.record.holder, "android");
  assert.equal(store.objects.get("ethereum:44'/60'/0'/0/0")?.record.released, true);
});

test("waits while another holder's lease is alive and acquires as soon as it is released", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(store, "key", options(clock, "ios"));

  let polls = 0;
  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", {
      sleep: async ms => {
        clock.now += ms;
        polls++;
        if (polls === 3) await ios.release();
      },
    }),
  );
  await android.release();

  assert.equal(polls, 3);
});

test("keeps a released account closed to the next holder until the settle window passes", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  const releasedAt = clock.now;

  const next = await acquireDistributedLock(store, "key", options(clock, "ios next spec"));
  await next.release();

  assert.ok(clock.now - releasedAt >= 45_000);
});

test("does not join a previous holder from the same process whose release was lost", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  await acquireDistributedLock(store, "key", options(clock, "worker-7:spec-1"));

  const nextSpec = await acquireDistributedLock(store, "key", options(clock, "worker-7:spec-2"));
  await nextSpec.release();

  assert.ok(clock.now > 60_000);
});

test("recovers its own lock when the store committed the claim but the response was lost", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.commitThenFailNextWrite = true;

  const lease = await acquireDistributedLock(store, "key", options(clock, "ios"));
  await lease.release();

  assert.ok(clock.now < 60_000, "recovered on the next poll instead of waiting out its own lease");
  assert.equal(store.objects.get("key")?.record.holder, "ios");
  assert.equal(store.objects.get("key")?.record.released, true);
});

test("renews its own unacknowledged claim instead of inheriting its age", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.commitThenFailNextWrite = true;
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { pollMs: 50_000 }),
  );

  clock.now = 70_000;

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "android", { acquireTimeoutMs: 0 })),
    /held by ios/,
  );
  await lease.release();
});

test("takes over a lock whose holder stopped renewing it and says so", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  await acquireDistributedLock(store, "key", options(clock, "crashed"));
  const { warnings, log } = createLogger();

  const survivor = await acquireDistributedLock(store, "key", options(clock, "survivor", { log }));
  await survivor.release();

  assert.equal(store.objects.get("key")?.record.holder, "survivor");
  assert.match(warnings[0], /took over "key" from crashed/);
});

test("keeps a live holder's lock by renewing its lease", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const live = await acquireDistributedLock(
    store,
    "key",
    options(clock, "live", { leaseMs: 1_000, heartbeatMs: 10 }),
  );

  for (const now of [900, 1_800]) {
    clock.now = now;
    await flushTimers();
  }
  clock.now = 2_700;

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "contender", { acquireTimeoutMs: 0 })),
    /timed out after 0ms waiting for "key" held by live/,
  );
  await live.release();
});

test("fails the release of a lease another holder took over, leaving their lock untouched", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const { warnings, log } = createLogger();
  let lostReported = false;
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "slow", {
      leaseMs: 1_000,
      heartbeatMs: 10,
      log,
      onLost: () => {
        lostReported = true;
      },
    }),
  );

  store.overwriteAsAnotherHolder("key");
  await flushTimers();

  await assert.rejects(lease.release(), {
    name: "ExclusiveLockLostError",
    message: /lost "key" to intruder \(intruder\) while holding it/,
  });
  assert.equal(lostReported, true);
  assert.match(warnings[0], /lost "key" to intruder/);
  assert.equal(store.objects.get("key")?.record.holder, "intruder");
  assert.equal(store.objects.get("key")?.record.released, false);
});

test("fails the release of a lease taken over since its last renewal", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const lease = await acquireDistributedLock(store, "key", options(clock, "slow"));

  store.overwriteAsAnotherHolder("key");

  await assert.rejects(lease.release(), { name: "ExclusiveLockLostError" });
  assert.equal(store.objects.get("key")?.record.released, false);
});

test("keeps its lease when a renewal committed but its response was lost", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const { warnings, log } = createLogger();
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { leaseMs: 1_000, heartbeatMs: 10, log }),
  );

  store.commitThenFailNextWrite = true;
  await flushTimers();
  await lease.release();

  assert.match(warnings[0], /heartbeat for "key" failed: socket hang up/);
  assert.equal(
    warnings.some(message => message.includes("lost")),
    false,
  );
  assert.equal(store.objects.get("key")?.record.holder, "ios");
  assert.equal(store.objects.get("key")?.record.released, true);
});

test("does not mistake its own committed release for a takeover", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const lease = await acquireDistributedLock(store, "key", options(clock, "ios"));

  store.commitThenFailNextWrite = true;
  await lease.release();

  assert.equal(store.objects.get("key")?.record.holder, "ios");
  assert.equal(store.objects.get("key")?.record.released, true);
});

test("does not mistake a claim right after its own committed release for a takeover", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  let next: AbandonableLease | undefined;
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", {
      sleep: async ms => {
        clock.now += ms;
        next ??= await acquireDistributedLock(store, "key", options(clock, "android"));
      },
    }),
  );

  store.commitThenFailNextWrite = true;
  await lease.abandon();

  assert.equal(store.objects.get("key")?.record.holder, "android");
  await next?.release();
});

test("does not mistake a claim right after it reads its own committed release for a takeover", async () => {
  const clock = { now: 0 };
  const store = new ClaimedRightAfterReadLockStore(clock);
  const lease = await acquireDistributedLock(store, "key", options(clock, "ios"));

  store.commitThenFailNextWrite = true;
  await lease.abandon();

  assert.equal(store.objects.get("key")?.record.holder, "intruder");
});

test("keeps its committed release as written instead of restarting the settle window", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 30_000 }),
  );

  store.commitThenFailNextWrite = true;
  await lease.release();

  assert.equal(store.objects.get("key")?.modifiedAt, 0);
});

test("marks the lease lost once failed renewals leave it about to lapse", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  let lostReported = false;
  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", {
      leaseMs: 1_000,
      heartbeatMs: 10,
      onLost: () => {
        lostReported = true;
      },
    }),
  );

  store.failuresLeft = Number.POSITIVE_INFINITY;
  clock.now = 995;
  await flushTimers();
  store.failuresLeft = 0;

  assert.equal(lostReported, true);
  await assert.rejects(lease.release(), { name: "ExclusiveLockLostError" });
});

test("fails a release it could not write once the lease has lapsed", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const lease = await acquireDistributedLock(store, "key", options(clock, "ios"));

  store.failuresLeft = Number.POSITIVE_INFINITY;
  clock.now = 70_000;

  await assert.rejects(lease.release(), { name: "ExclusiveLockLostError" });
});

test("gives up on a release it could not write while the lease is still alive", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const { warnings, log } = createLogger();
  const lease = await acquireDistributedLock(store, "key", options(clock, "ios", { log }));

  store.failuresLeft = Number.POSITIVE_INFINITY;
  await lease.release();

  assert.match(warnings[0], /failed to release "key", it frees itself once its lease expires/);
});

test("retries a failed release before giving the account back to its lease", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const lease = await acquireDistributedLock(store, "key", options(clock, "ios"));

  store.failuresLeft = 2;
  await lease.release();

  assert.equal(store.objects.get("key")?.record.released, true);
});

test("retries through transient lock store errors and still acquires", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.failuresLeft = 2;
  const { warnings, log } = createLogger();

  const lease = await acquireDistributedLock(store, "key", options(clock, "ios", { log }));
  await lease.release();

  assert.equal(warnings.filter(message => message.includes("R2 unavailable")).length, 2);
});

test("stops waiting at the first lock store error that retrying cannot fix", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.failuresLeft = 1;
  store.failure = new ExclusiveLockStoreFatalError("R2 PUT failed with 403: AccessDenied");

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "ios")),
    /403: AccessDenied/,
  );
  assert.equal(clock.now, 0);
});

test("stops at once when the store keeps rejecting the ETag it returned for a free lock", async () => {
  const clock = { now: 0 };
  const store = new WeakEtagLockStore(clock);
  const first = await acquireDistributedLock(store, "key", options(clock, "ios"));
  await first.release();

  await assert.rejects(acquireDistributedLock(store, "key", options(clock, "android")), {
    name: "ExclusiveLockStoreFatalError",
    message: /keeps rejecting "key" at ETag W\/"v2"/,
  });
  assert.ok(clock.now < 10_000, "failed within a few polls instead of waiting out the timeout");
});

test("keeps trying while rivals keep winning a free lock", async () => {
  const clock = { now: 0 };
  const store = new ContestedLockStore(clock);
  const first = await acquireDistributedLock(store, "key", options(clock, "ios"));
  await first.release();
  store.rivalWinsLeft = 5;

  const lease = await acquireDistributedLock(store, "key", options(clock, "android"));
  await lease.release();

  assert.equal(store.objects.get("key")?.record.holder, "android");
});

test("gives up as soon as the key is held when told not to wait", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(store, "key", options(clock, "ios"));

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "android", { giveUpWhenHeld: true })),
    { name: "ExclusiveLockBusyError", message: /gave up on "key" held by ios/ },
  );
  assert.equal(clock.now, 0);
  await ios.release();
});

test("claims a released key the moment its settle window ends when waiting for it", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 5_000;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { pollMs: 7_000 }),
  );
  await android.release();

  assert.equal(clock.now, 45_000);
});

test("claims last at settle end when it has only just started waiting", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 5_000;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { settleClaimSpreadMs: 3_000 }),
  );
  await android.release();

  assert.equal(clock.now, 48_000);
});

test("claims first at settle end once it has waited ten minutes", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000, leaseMs: 3_600_000 }),
  );
  let releasedAt: number | undefined;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", {
      settleClaimSpreadMs: 3_000,
      acquireTimeoutMs: 3_600_000,
      sleep: async ms => {
        clock.now += ms;
        if (releasedAt === undefined && clock.now >= 600_000) {
          releasedAt = clock.now;
          await ios.release();
        }
      },
    }),
  );
  await android.release();

  assert.equal(clock.now - (releasedAt ?? 0), 45_000);
});

test("claims the moment the settle window ends with high priority, even when it has only just started waiting", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 5_000;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", {
      settleClaimSpreadMs: 3_000,
      settleClaimHeadStartMs: 2_000,
      highPriority: true,
    }),
  );
  await android.release();

  assert.equal(clock.now, 45_000);
});

test("leaves the head start of a settle window to high-priority waiters once it has waited ten minutes", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000, leaseMs: 3_600_000 }),
  );
  let releasedAt: number | undefined;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", {
      settleClaimSpreadMs: 3_000,
      settleClaimHeadStartMs: 2_000,
      acquireTimeoutMs: 3_600_000,
      sleep: async ms => {
        clock.now += ms;
        if (releasedAt === undefined && clock.now >= 600_000) {
          releasedAt = clock.now;
          await ios.release();
        }
      },
    }),
  );
  await android.release();

  assert.equal(clock.now - (releasedAt ?? 0), 47_000);
});

test("claims last at settle end after the head start when it has only just started waiting", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 5_000;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { settleClaimSpreadMs: 3_000, settleClaimHeadStartMs: 2_000 }),
  );
  await android.release();

  assert.equal(clock.now, 48_000);
});

test("waits out a released key's settle window a poll after waiting holders instead of giving up on it", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 5_000;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { giveUpWhenHeld: true }),
  );
  await android.release();

  assert.equal(clock.now, 46_000);
});

test("keeps waiting out the same settle window when the lock store's clock runs behind", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  let sleeps = 0;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", {
      giveUpWhenHeld: true,
      sleep: async ms => {
        sleeps++;
        clock.now += sleeps === 1 ? ms - 2_000 : ms;
      },
    }),
  );
  await android.release();

  assert.equal(sleeps, 2);
  assert.equal(store.objects.get("key")?.record.holder, "android");
});

test("gives up when another holder takes the key while it settles", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  let rival: Awaited<ReturnType<typeof acquireDistributedLock>> | undefined;

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "android", {
        giveUpWhenHeld: true,
        sleep: async ms => {
          clock.now += ms;
          rival ??= await acquireDistributedLock(store, "key", options(clock, "rival"));
        },
      }),
    ),
    { name: "ExclusiveLockBusyError", message: /gave up on "key" held by rival/ },
  );
  await rival?.release();
});

test("gives up when another holder takes and releases the key while it settles", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  let rivalDone = false;

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "android", {
        giveUpWhenHeld: true,
        sleep: async ms => {
          clock.now += ms;
          if (rivalDone) return;
          rivalDone = true;
          const rival = await acquireDistributedLock(
            store,
            "key",
            options(clock, "rival", { settleMs: 45_000 }),
          );
          await rival.release();
        },
      }),
    ),
    { name: "ExclusiveLockBusyError", message: /gave up on "key" held by rival/ },
  );
});

test("gives up on a settle window whose age stops advancing", async () => {
  const clock = { now: 0 };
  const store = new FrozenAgeLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  let sleeps = 0;

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "android", {
        giveUpWhenHeld: true,
        sleep: async ms => {
          clock.now += ms;
          sleeps++;
        },
      }),
    ),
    { name: "ExclusiveLockBusyError" },
  );
  assert.equal(sleeps, 1);
});

test("retries the lock store in full after waiting out a settle window", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await ios.release();
  clock.now = 18_000;
  store.commitThenFailNextWrite = true;

  const android = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { giveUpWhenHeld: true, acquireTimeoutMs: 30_000, pollMs: 5_000 }),
  );
  await android.release();

  assert.deepEqual(
    {
      holder: store.objects.get("key")?.record.holder,
      released: store.objects.get("key")?.record.released,
    },
    { holder: "android", released: true },
  );
});

test("does not announce a wait for a key it gives up on", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(store, "key", options(clock, "ios"));
  const logger = createLogger();

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "android", { giveUpWhenHeld: true, log: logger.log }),
    ),
    { name: "ExclusiveLockBusyError" },
  );
  assert.deepEqual(
    logger.infos.filter(message => message.includes("waiting for")),
    [],
  );
  await ios.release();
});

test("reports a lock store that never answers as an error, not as a busy key", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.failuresLeft = Number.POSITIVE_INFINITY;

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "ios", { giveUpWhenHeld: true, acquireTimeoutMs: 30_000 }),
    ),
    (error: Error) => {
      assert.equal(error.name, "Error");
      assert.match(
        error.message,
        /timed out after 30000ms waiting for "key"; last store error: R2 unavailable/,
      );
      return true;
    },
  );
});

test("gives up once every lock store request has failed for the outage budget", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.failuresLeft = Number.POSITIVE_INFINITY;

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "ios", { storeOutageMs: 120_000 })),
    {
      name: "ExclusiveLockStoreDownError",
      message: /failed for \d+ms; last store error: R2 unavailable/,
    },
  );
  assert.ok(clock.now >= 120_000 && clock.now < 125_000);
});

test("keeps waiting through lock store errors the store answers in between", async () => {
  const clock = { now: 0 };
  const store = new EveryOtherCreateFailsLockStore(clock);
  store.overwriteAsAnotherHolder("key");

  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { storeOutageMs: 2_000 }),
  );
  await lease.release();

  assert.ok(clock.now > 60_000);
  assert.equal(store.objects.get("key")?.record.holder, "ios");
});

test("retries lock store errors before giving up when told not to wait", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  store.failuresLeft = 2;

  const lease = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { giveUpWhenHeld: true, acquireTimeoutMs: 30_000 }),
  );
  await lease.release();

  assert.equal(store.objects.get("key")?.record.holder, "ios");
});

test("frees an abandoned key at once, without the settle window", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const abandoned = await acquireDistributedLock(
    store,
    "key",
    options(clock, "ios", { settleMs: 45_000 }),
  );
  await abandoned.abandon();

  const next = await acquireDistributedLock(
    store,
    "key",
    options(clock, "android", { giveUpWhenHeld: true }),
  );
  await next.release();

  assert.equal(clock.now, 0);
});

test("fails closed once the wait exceeds the acquire timeout, naming the current holder", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);
  const ios = await acquireDistributedLock(store, "key", options(clock, "ios"));

  await assert.rejects(
    acquireDistributedLock(store, "key", options(clock, "android", { acquireTimeoutMs: 5_000 })),
    /timed out after 5000ms waiting for "key" held by ios \(ios spec\)/,
  );
  await ios.release();
});

test("rejects a heartbeat that would not renew the lease before it expires", async () => {
  const clock = { now: 0 };
  const store = new MemoryLockStore(clock);

  await assert.rejects(
    acquireDistributedLock(
      store,
      "key",
      options(clock, "ios", { leaseMs: 1_000, heartbeatMs: 1_000 }),
    ),
    /heartbeatMs must be shorter than leaseMs/,
  );
});
