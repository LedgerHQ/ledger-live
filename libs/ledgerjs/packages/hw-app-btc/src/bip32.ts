import bippath from "bip32-path";
import bs58check from "bs58check";

export function pathElementsToBuffer(paths: number[]): Buffer {
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}

export function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : pathStringToArray(path);
  return pathElementsToBuffer(pathElements);
}

export function pathArrayToString(pathElements: number[]): string {
  // Limitation: bippath can't handle and empty path. It shouldn't affect us
  // right now, but might in the future.
  // TODO: Fix support for empty path.
  return bippath.fromPathArray(pathElements).toString();
}

export function pathStringToArray(path: string): number[] {
  return bippath.fromString(path).toPathArray();
}

export function pubkeyFromXpub(xpub: string): Buffer {
  const xpubBuf = bs58check.decode(xpub);
  return xpubBuf.slice(xpubBuf.length - 33);
}

export function getXpubComponents(xpub: string): {
  chaincode: Buffer;
  pubkey: Buffer;
  version: number;
} {
  const xpubBuf: Buffer = bs58check.decode(xpub);
  return {
    chaincode: xpubBuf.slice(13, 13 + 32),
    pubkey: xpubBuf.slice(xpubBuf.length - 33),
    version: xpubBuf.readUInt32BE(0),
  };
}

export function hardenedPathOf(pathElements: number[]): number[] {
  for (let i = pathElements.length - 1; i >= 0; i--) {
    if (pathElements[i] >= 0x80000000) {
      return pathElements.slice(0, i + 1);
    }
  }
  return [];
}
