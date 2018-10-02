// @flow

import { Buffer } from "buffer";

type Chunk = {
  chunksCount: number,
  index: number,
  data: string
};

/**
 * reduce chunks data array to add on more chunk to it
 * @memberof bridgestream/importer
 */
export function parseChunksReducer(
  chunks: Chunk[],
  chunk: string,
  logger?: typeof console
): Chunk[] {
  try {
    const head = Buffer.from(chunk.slice(0, 5));
    const version = head.readUInt8(0);
    const chunksCount = head.readUInt16BE(1);
    const index = head.readUInt16BE(3);
    const data = chunk.slice(5);
    if (version !== 1) {
      throw new Error(`qrstream version not supported. Got: ${version}`);
    }
    if (chunksCount <= 0) {
      throw new Error("invalid chunksCount");
    }
    if (index < 0 || index >= chunksCount) {
      throw new Error("invalid index");
    }
    if (chunks.length > 0 && chunksCount !== chunks[0].chunksCount) {
      throw new Error(
        `different dataLength. Got: ${chunksCount}, Expected: ${
          chunks[0].chunksCount
        }`
      );
    }
    if (chunks.some(c => c.index === index)) {
      // chunk already exists. we are just ignoring
      return chunks;
    }
    return chunks.concat({ chunksCount, index, data });
  } catch (e) {
    if (logger) logger.warn(`Invalid chunk ${e.message}`);
    return chunks;
  }
}

/**
 * check if the chunks have all been retrieved
 * @memberof bridgestream/importer
 */
export const areChunksComplete = (chunks: Chunk[]): boolean =>
  chunks.length > 0 && chunks[0].chunksCount === chunks.length;

/**
 * return final result of the chunks. assuming you have checked `areChunksComplete`
 * @memberof bridgestream/importer
 */
export function chunksToResult(rawChunks: Chunk[]): string {
  return rawChunks
    .slice(0)
    .sort((a, b) => a.index - b.index)
    .map(chunk => chunk.data)
    .join("");
}
