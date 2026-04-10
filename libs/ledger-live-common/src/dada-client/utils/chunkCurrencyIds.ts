export type CurrencyIdChunks = string[][];

const DEFAULT_CHUNK_SIZE = 25;

export function chunkCurrencyIds(
  ids: string[],
  size: number = DEFAULT_CHUNK_SIZE,
): CurrencyIdChunks {
  if (!Number.isFinite(size) || size <= 0) {
    throw new RangeError(`chunkCurrencyIds: size must be a positive finite number, got ${size}`);
  }

  const chunks: CurrencyIdChunks = [];

  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }

  return chunks;
}
