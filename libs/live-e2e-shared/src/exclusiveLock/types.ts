export type LockRecord = {
  readonly holder: string;
  readonly label: string;
  readonly leaseMs: number;
  readonly settleMs: number;
  readonly released: boolean;
};

export type StoredLock = {
  readonly record: LockRecord;
  readonly etag: string;
  readonly ageMs: number;
};

export type LockStore = {
  read(key: string): Promise<StoredLock | undefined>;
  create(key: string, record: LockRecord): Promise<string | undefined>;
  replace(key: string, record: LockRecord, etag: string): Promise<string | undefined>;
};

export type Lease = {
  release(): Promise<void>;
};

/**
 * A lease that can be handed back without the settle window when nothing was broadcast under it,
 * or only transactions already confirmed.
 */
export type AbandonableLease = Lease & {
  abandon(): Promise<void>;
};

export type LockLogger = {
  info(message: string): void;
  warn(message: string): void;
};
