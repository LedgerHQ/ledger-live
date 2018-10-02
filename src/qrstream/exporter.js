// @flow

import { Buffer } from "buffer";

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}

/**
 * export data into a chunk of string that you can generate a QR with
 * @memberof bridgestream/exporter
 */
export function makeChunks(data: string, chunkSize: number): string[] {
  const dataSize = chunkSize - 2;
  const dataChunks = chunkSubstr(data, dataSize);
  const r = dataChunks.map(
    // version: 1 byte
    // nb of frames: 2 bytes
    // index of frames: 2 bytes
    // data: variable
    (data, i) => {
      const head = Buffer.alloc(5);
      head.writeUInt8(1, 0); // version 1 of the format
      head.writeUInt16BE(dataChunks.length, 1);
      head.writeUInt16BE(i, 3);
      return head.toString() + data;
    }
  );
  if (r.length > 255) {
    throw new Error("too much data");
  }
  return r;
}
