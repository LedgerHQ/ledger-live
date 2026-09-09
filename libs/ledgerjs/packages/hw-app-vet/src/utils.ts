import { Buffer } from "buffer";

export const splitPath = (path: string): number[] => {
  const result: number[] = [];
  const components = path.split("/");
  for (const element of components) {
    // Fail closed: reject empty/non-numeric/truncated segments (e.g. "NOTAINDEX", "12abc'").
    if (!/^\d+'?$/.test(element)) {
      throw new Error(`Invalid BIP32 path segment: ${element}`);
    }
    if (parseInt(element, 10) > 0x7fffffff) {
      throw new Error(`Invalid BIP32 path segment: ${element}`);
    }
    let number = parseInt(element, 10);
    if (element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  }
  return result;
};

export const splitRaw = (path: string, rawHex: string, isTransaction: boolean): Buffer[] => {
  const contentByteLength = isTransaction ? 0 : 4;
  const paths = splitPath(path);
  let offset = 0;
  const raw = Buffer.from(rawHex, "hex");
  const buffers: Buffer[] = [];
  while (offset !== raw.length) {
    const maxChunkSize = offset === 0 ? 255 - 1 - paths.length * 4 - contentByteLength : 255;
    const chunkSize = offset + maxChunkSize > raw.length ? raw.length - offset : maxChunkSize;
    const buffer = Buffer.alloc(
      offset === 0 ? 1 + paths.length * 4 + contentByteLength + chunkSize : chunkSize,
    );
    if (offset === 0) {
      buffer[0] = paths.length;
      paths.forEach((element, index) => {
        buffer.writeUInt32BE(element, 1 + 4 * index);
      });
      if (isTransaction) {
        raw.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        buffer.writeUInt32BE(raw.length, 1 + 4 * paths.length);
        raw.copy(buffer, 1 + 4 * paths.length + 4, offset, offset + chunkSize);
      }
    } else {
      raw.copy(buffer, 0, offset, offset + chunkSize);
    }
    buffers.push(buffer);
    offset += chunkSize;
  }
  return buffers;
};
