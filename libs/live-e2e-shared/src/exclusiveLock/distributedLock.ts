import {
  ExclusiveLockBusyError,
  ExclusiveLockLostError,
  ExclusiveLockStoreDownError,
  ExclusiveLockStoreFatalError,
} from "../errors";
import type { AbandonableLease, LockLogger, LockRecord, LockStore, StoredLock } from "./types";

export type DistributedLockOptions = {
  readonly holder: string;
  readonly label: string;
  readonly leaseMs: number;
  readonly settleMs: number;
  readonly heartbeatMs: number;
  readonly pollMs: number;
  readonly acquireTimeoutMs: number;
  /** Gives up once every lock store request has failed for this long, e.g. while it is down. */
  readonly storeOutageMs?: number;
  readonly giveUpWhenHeld?: boolean;
  /** Waiters spread their claims over it when a settle window ends, the longest-waiting first. */
  readonly settleClaimSpreadMs?: number;
  readonly log: LockLogger;
  readonly onLost?: () => void;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
};

type ClaimResult =
  | { readonly status: "claimed"; readonly etag: string; readonly previous?: StoredLock }
  | { readonly status: "held"; readonly current: StoredLock }
  | { readonly status: "raced"; readonly rejectedEtag?: string };

const RELEASE_ATTEMPTS = 3;
const UNCHANGED_ETAG_REJECTIONS_BEFORE_FATAL = 3;
const RELEASE_RETRY_DELAY_MS = 1_000;
// A waiter that has waited this long claims as soon as a settle window ends.
const FIRST_IN_LINE_AFTER_MS = 10 * 60_000;

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const isFatalStoreError = (error: unknown) =>
  error instanceof Error && error.name === "ExclusiveLockStoreFatalError";

const isLockFree = ({ record, ageMs }: StoredLock) =>
  (record.released && ageMs >= record.settleMs) || ageMs > record.leaseMs;

const settleLeftMs = ({ record, ageMs }: StoredLock) => record.settleMs - ageMs;

async function claim(store: LockStore, key: string, record: LockRecord): Promise<ClaimResult> {
  const created = await store.create(key, record);
  if (created) return { status: "claimed", etag: created };

  const current = await store.read(key);
  if (!current) return { status: "raced" };
  const ownClaimCommittedUnacknowledged = current.record.holder === record.holder;
  if (!ownClaimCommittedUnacknowledged && !isLockFree(current)) {
    return { status: "held", current };
  }

  const replaced = await store.replace(key, record, current.etag);
  if (!replaced) return { status: "raced", rejectedEtag: current.etag };
  return {
    status: "claimed",
    etag: replaced,
    previous: ownClaimCommittedUnacknowledged ? undefined : current,
  };
}

function hold(
  store: LockStore,
  key: string,
  record: LockRecord,
  initialEtag: string,
  claimSentAt: number,
  options: DistributedLockOptions,
): AbandonableLease {
  const { log, heartbeatMs, leaseMs } = options;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  let etag = initialEtag;
  let renewedAt = claimSentAt;
  let lost: ExclusiveLockLostError | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingBeat: Promise<void> = Promise.resolve();

  const markLost = (takenBy: StoredLock | undefined) => {
    const newHolder = takenBy ? ` to ${takenBy.record.holder} (${takenBy.record.label})` : "";
    lost = new ExclusiveLockLostError(
      `[exclusiveLock] lost "${key}"${newHolder} while holding it: its lease expired, so broadcasts from it may have overlapped`,
    );
    options.onLost?.();
    log.warn(lost.message);
  };

  const markLostIfLeaseLapsesWithin = (marginMs: number) => {
    if (!lost && now() - renewedAt + marginMs >= leaseMs) markLost(undefined);
  };

  const writeOwnRecord = async (
    next: LockRecord,
    releaseMayHaveLanded = false,
  ): Promise<boolean> => {
    const sentAt = now();
    const written = await store.replace(key, next, etag);
    if (written) {
      etag = written;
      renewedAt = sentAt;
      return true;
    }
    const current = await store.read(key);
    const ourLastWrite = current?.record.holder === record.holder ? current : undefined;
    if (releaseMayHaveLanded && ourLastWrite?.record.released) return true;
    const rewritten = ourLastWrite ? await store.replace(key, next, ourLastWrite.etag) : undefined;
    if (rewritten) {
      etag = rewritten;
      renewedAt = sentAt;
      return true;
    }
    // Nobody can take a lease before it expires, so another holder within it means the release an
    // earlier attempt sent was written and only its response was lost.
    const releasedBeforeTheirClaim =
      releaseMayHaveLanded && current !== undefined && !ourLastWrite && now() - renewedAt < leaseMs;
    if (releasedBeforeTheirClaim) return true;
    markLost(ourLastWrite ? undefined : current);
    return false;
  };

  const beat = async () => {
    try {
      await writeOwnRecord(record);
    } catch (error) {
      log.warn(`[exclusiveLock] heartbeat for "${key}" failed: ${errorMessage(error)}`);
      markLostIfLeaseLapsesWithin(heartbeatMs);
    }
  };

  const scheduleBeat = () => {
    timer = setTimeout(() => {
      pendingBeat = beat().then(() => {
        if (!stopped && !lost) scheduleBeat();
      });
    }, heartbeatMs);
    timer.unref?.();
  };
  scheduleBeat();

  const writeReleasedRecord = async (settleMs: number, attempt = 1): Promise<void> => {
    try {
      if (await writeOwnRecord({ ...record, released: true, settleMs }, attempt > 1)) {
        log.info(`[exclusiveLock] released "${key}" (${record.label})`);
      }
    } catch (error) {
      if (attempt < RELEASE_ATTEMPTS && !isFatalStoreError(error)) {
        await sleep(RELEASE_RETRY_DELAY_MS);
        return writeReleasedRecord(settleMs, attempt + 1);
      }
      markLostIfLeaseLapsesWithin(0);
      if (!lost) {
        log.warn(
          `[exclusiveLock] failed to release "${key}", it frees itself once its lease expires: ${errorMessage(error)}`,
        );
      }
    }
  };

  const stop = async (settleMs: number) => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    await pendingBeat;
    if (!lost) await writeReleasedRecord(settleMs);
    if (lost) throw lost;
  };

  return {
    release: () => stop(record.settleMs),
    abandon: () => stop(0),
  };
}

type Claimed = Extract<ClaimResult, { status: "claimed" }>;

class Acquisition {
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;
  private readonly record: LockRecord;
  private readonly startedAt: number;
  private retryFrom: number;
  private lastHeld: StoredLock | undefined;
  private lastError: unknown;
  private failingSince: number | undefined;
  private announcedWait = false;
  private rejectedEtag: string | undefined;
  private unchangedEtagRejections = 0;
  private settleWaitedOut: { readonly etag: string; readonly leftMs: number } | undefined;

  constructor(
    private readonly store: LockStore,
    private readonly key: string,
    private readonly options: DistributedLockOptions,
  ) {
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
    this.record = {
      holder: options.holder,
      label: options.label,
      leaseMs: options.leaseMs,
      settleMs: options.settleMs,
      released: false,
    };
    this.startedAt = this.now();
    this.retryFrom = this.startedAt;
  }

  async acquire(): Promise<AbandonableLease> {
    const claimSentAt = this.now();
    const result = await this.tryClaim();
    if (result?.status === "claimed") return this.granted(result, claimSentAt);
    await this.waitBeforeNextClaim(result?.status === "held" ? result.current : undefined);
    return this.acquire();
  }

  /** Resolves to undefined when the store failed in a way a later claim may get past. */
  private async tryClaim(): Promise<ClaimResult | undefined> {
    try {
      const result = await claim(this.store, this.key, this.record);
      this.trackRejectedEtag(result);
      if (result.status === "held") this.lastHeld = result.current;
      this.lastError = undefined;
      this.failingSince = undefined;
      return result;
    } catch (error) {
      if (isFatalStoreError(error)) throw error;
      this.lastError = error;
      this.failingSince ??= this.now();
      this.options.log.warn(
        `[exclusiveLock] lock store error on "${this.key}": ${errorMessage(error)}`,
      );
      return undefined;
    }
  }

  private trackRejectedEtag(result: ClaimResult) {
    const rejectedAgain = result.status === "raced" && result.rejectedEtag === this.rejectedEtag;
    this.unchangedEtagRejections = rejectedAgain ? this.unchangedEtagRejections + 1 : 1;
    this.rejectedEtag = result.status === "raced" ? result.rejectedEtag : undefined;
    if (
      this.rejectedEtag &&
      this.unchangedEtagRejections >= UNCHANGED_ETAG_REJECTIONS_BEFORE_FATAL
    ) {
      throw new ExclusiveLockStoreFatalError(
        `[exclusiveLock] the lock store keeps rejecting "${this.key}" at ETag ${this.rejectedEtag} although nothing rewrote it, so its If-Match cannot be trusted`,
      );
    }
  }

  private granted({ etag, previous }: Claimed, claimSentAt: number): AbandonableLease {
    const { log } = this.options;
    if (previous && !previous.record.released) {
      log.warn(
        `[exclusiveLock] took over "${this.key}" from ${previous.record.holder} (${previous.record.label}): its lease expired ${previous.ageMs - previous.record.leaseMs}ms ago`,
      );
    }
    log.info(
      `[exclusiveLock] acquired "${this.key}" after ${this.now() - this.startedAt}ms (${this.options.label})`,
    );
    return hold(this.store, this.key, this.record, etag, claimSentAt, this.options);
  }

  /** Throws instead when the acquisition has to stop: given up, store down, timed out. */
  private async waitBeforeNextClaim(held: StoredLock | undefined): Promise<void> {
    const settling = held?.record.released ? held : undefined;
    const { giveUpWhenHeld, pollMs } = this.options;
    if (held && giveUpWhenHeld && !(settling && this.settleCountsDown(settling))) {
      throw new ExclusiveLockBusyError(`[exclusiveLock] gave up on "${this.key}"${this.heldBy()}`);
    }
    if (held) this.announceWait();
    if (settling && giveUpWhenHeld) {
      this.settleWaitedOut = { etag: settling.etag, leftMs: settleLeftMs(settling) };
      // A poll later than the holders waiting for the key, so they claim it first.
      await this.sleep(this.settleWaitedOut.leftMs + pollMs);
      this.retryFrom = this.now();
      return;
    }
    this.throwIfStoreDown();
    this.throwIfTimedOut();
    await this.sleep(
      settling ? settleLeftMs(settling) + this.settleClaimDelayMs() : this.pollDelayMs(),
    );
  }

  private settleClaimDelayMs() {
    const spreadMs = this.options.settleClaimSpreadMs ?? 0;
    const waitedShare = Math.min(1, (this.now() - this.startedAt) / FIRST_IN_LINE_AFTER_MS);
    return Math.round(spreadMs * (1 - waitedShare));
  }

  private settleCountsDown(settling: StoredLock) {
    const waitedOut = this.settleWaitedOut;
    return (
      !waitedOut || (waitedOut.etag === settling.etag && settleLeftMs(settling) < waitedOut.leftMs)
    );
  }

  private announceWait() {
    if (this.announcedWait) return;
    this.announcedWait = true;
    this.options.log.info(`[exclusiveLock] waiting for "${this.key}",${this.heldBy()}`);
  }

  private throwIfStoreDown() {
    const { storeOutageMs } = this.options;
    if (storeOutageMs === undefined || this.failingSince === undefined) return;
    const failingForMs = this.now() - this.failingSince;
    if (failingForMs < storeOutageMs) return;
    throw new ExclusiveLockStoreDownError(
      `[exclusiveLock] every lock store request on "${this.key}" failed for ${failingForMs}ms; last store error: ${errorMessage(this.lastError)}`,
    );
  }

  private throwIfTimedOut() {
    const { acquireTimeoutMs, giveUpWhenHeld } = this.options;
    if (this.now() - this.retryFrom < acquireTimeoutMs) return;
    const cause = this.lastError ? `; last store error: ${errorMessage(this.lastError)}` : "";
    const message = `[exclusiveLock] timed out after ${acquireTimeoutMs}ms waiting for "${this.key}"${this.heldBy()}${cause}`;
    const keptByHolder = this.lastHeld && !giveUpWhenHeld;
    throw keptByHolder ? new ExclusiveLockBusyError(message) : new Error(message);
  }

  private heldBy() {
    const held = this.lastHeld?.record;
    return held ? ` held by ${held.holder} (${held.label})` : "";
  }

  private pollDelayMs() {
    const { pollMs } = this.options;
    return pollMs + Math.floor(this.random() * (pollMs / 2));
  }
}

/**
 * Holds `key` until the returned lease is released. A holder that stops renewing is taken over
 * once its lease expires, and a released key stays closed for `settleMs` so the next holder
 * builds its transaction on top of the previous one's. Waiting past `acquireTimeoutMs`, a store
 * failing every request for `storeOutageMs`, or a store error that retrying cannot fix, throws,
 * and so does releasing a lease that was taken over.
 */
export async function acquireDistributedLock(
  store: LockStore,
  key: string,
  options: DistributedLockOptions,
): Promise<AbandonableLease> {
  if (options.heartbeatMs >= options.leaseMs) {
    throw new Error("[exclusiveLock] heartbeatMs must be shorter than leaseMs");
  }
  return new Acquisition(store, key, options).acquire();
}
