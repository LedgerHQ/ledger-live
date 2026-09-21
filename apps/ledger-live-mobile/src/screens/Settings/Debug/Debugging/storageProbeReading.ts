/**
 * Aggregation logic for the AsyncStorage migration probe (LIVE-37322).
 *
 * This module never returns or logs a stored value: only keys, counts, byte
 * sizes and hashes derived from the values. Keep it that way — it exists to be
 * pasted into a before/after diff of a wallet's real storage.
 */

export type StorageProbeEntry = readonly [key: string, value: string | null];

export type StorageProbeKeyInfo = {
  key: string;
  sizeBytes: number;
};

export type StorageProbeGroup = {
  prefix: string;
  count: number;
  hash: string;
};

export type StorageProbeReading = {
  totalKeys: number;
  totalHash: string;
  groups: StorageProbeGroup[];
  largestKeys: StorageProbeKeyInfo[];
};

const LARGEST_KEYS_LIMIT = 20;
const PAIR_SEPARATOR = "\u0000";
const PREFIX_SEPARATOR = "/";

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Incremental FNV-1a 32-bit hash. Cheap and deterministic, not cryptographic —
 * good enough to compare two readings of the same storage byte-for-byte.
 */
class RunningHash {
  private hash = FNV_OFFSET_BASIS;

  update(value: string): this {
    for (let i = 0; i < value.length; i++) {
      this.hash ^= value.charCodeAt(i);
      this.hash = Math.imul(this.hash, FNV_PRIME);
    }
    return this;
  }

  digest(): string {
    return (this.hash >>> 0).toString(16).padStart(8, "0");
  }
}

/** UTF-8 byte length of a string, without allocating a buffer. */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate of a surrogate pair: the pair encodes one 4-byte UTF-8 code point.
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** First path segment of a key, e.g. "user/foo" -> "user". Keys without a "/" are their own prefix. */
function keyPrefix(key: string): string {
  const separatorIndex = key.indexOf(PREFIX_SEPARATOR);
  return separatorIndex === -1 ? key : key.slice(0, separatorIndex);
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Builds a full, value-free reading of a storage snapshot: total key count, a
 * stable hash over every key/value pair, a per-prefix breakdown (to catch
 * partial namespace loss a total count alone would miss), and the 20 largest
 * keys by value size.
 */
export function buildStorageProbeReading(
  entries: readonly StorageProbeEntry[],
): StorageProbeReading {
  const sortedEntries = [...entries].sort(([a], [b]) => compareStrings(a, b));

  const totalHash = new RunningHash();
  const groupHashes = new Map<string, RunningHash>();
  const groupCounts = new Map<string, number>();
  const keySizes: StorageProbeKeyInfo[] = [];

  for (const [key, value] of sortedEntries) {
    const safeValue = value ?? "";

    totalHash.update(key).update(PAIR_SEPARATOR).update(safeValue).update(PAIR_SEPARATOR);

    const prefix = keyPrefix(key);
    const groupHash = groupHashes.get(prefix) ?? new RunningHash();
    groupHash.update(key).update(PAIR_SEPARATOR).update(safeValue).update(PAIR_SEPARATOR);
    groupHashes.set(prefix, groupHash);
    groupCounts.set(prefix, (groupCounts.get(prefix) ?? 0) + 1);

    keySizes.push({ key, sizeBytes: utf8ByteLength(safeValue) });
  }

  const groups = Array.from(groupCounts.keys())
    .sort(compareStrings)
    .map(prefix => ({
      prefix,
      count: groupCounts.get(prefix) as number,
      hash: (groupHashes.get(prefix) as RunningHash).digest(),
    }));

  const largestKeys = [...keySizes]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, LARGEST_KEYS_LIMIT);

  return {
    totalKeys: sortedEntries.length,
    totalHash: totalHash.digest(),
    groups,
    largestKeys,
  };
}

/** Renders a reading as plain text for a before/after diff. Never includes a stored value. */
export function formatStorageProbeReading(reading: StorageProbeReading): string {
  const lines: string[] = [];

  lines.push(`Total keys: ${reading.totalKeys}`);
  lines.push(`Total hash: ${reading.totalHash}`);
  lines.push("");
  lines.push(`Per-prefix breakdown (${reading.groups.length}):`);
  for (const group of reading.groups) {
    lines.push(`  ${group.prefix} — count=${group.count} hash=${group.hash}`);
  }
  lines.push("");
  lines.push(`${reading.largestKeys.length} largest keys (name, size in bytes):`);
  for (const entry of reading.largestKeys) {
    lines.push(`  ${entry.key} — ${entry.sizeBytes} bytes`);
  }

  return lines.join("\n");
}
