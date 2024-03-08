import bippath from "bip32-path";
import sha from "sha.js";

export function sha256(buffer: Buffer | string) {
  return sha("sha256").update(buffer).digest();
}

export function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : pathStringToArray(path);
  return pathElementsToBuffer(pathElements);
}

function pathElementsToBuffer(paths: number[]): Buffer {
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}

function pathStringToArray(path: string): number[] {
  return bippath.fromString(path).toPathArray();
}
