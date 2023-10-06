import { Buffer } from "buffer";

export const splitPath = (path: string): number[] => {
  return path
    .split("/")
    .map(elem => {
      let num = parseInt(elem, 10);
      if (elem.length > 1 && elem[elem.length - 1] === "'") {
        num += 0x80000000;
      }
      return num;
    })
    .filter(num => !isNaN(num));
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
