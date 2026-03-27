/**
 * Distributes files across shards evenly using floor + remainder.
 * Using Math.ceil would over-allocate slots:
 * e.g. ceil(33/12) = 3 → 12×3 = 36 slots for 33 files → shard 12 is empty.
 */
export function distributeFilesRoundRobinNoTiming(files, shardIndex, shardTotal) {
  const baseCount = Math.floor(files.length / shardTotal);
  const remainder = files.length % shardTotal;
  const startIndex = (shardIndex - 1) * baseCount + Math.min(shardIndex - 1, remainder);
  const count = baseCount + (shardIndex <= remainder ? 1 : 0);
  return files.slice(startIndex, startIndex + count);
}
