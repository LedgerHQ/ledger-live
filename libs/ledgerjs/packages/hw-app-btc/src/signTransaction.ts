import type Transport from "@ledgerhq/hw-transport";
import { bip32asBuffer } from "./bip32";
export function signTransaction(
  transport: Transport,
  path: string,
  lockTime: number,
  sigHashType: number,
  expiryHeight?: Buffer,
  additionals: Array<string> = []
): Promise<Buffer> {
  const isDecred = additionals.includes("decred");
  const pathsBuffer = bip32asBuffer(path);
  const lockTimeBuffer = Buffer.alloc(4);
  lockTimeBuffer.writeUInt32BE(lockTime, 0);
  let buffer = isDecred
    ? Buffer.concat([
        pathsBuffer,
        lockTimeBuffer,
        expiryHeight || Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from([sigHashType]),
      ])
    : Buffer.concat([
        pathsBuffer,
        Buffer.from([0x00]),
        lockTimeBuffer,
        Buffer.from([sigHashType]),
      ]);

  if (expiryHeight && !isDecred) {
    buffer = Buffer.concat([buffer, expiryHeight]);
  }

  return transport.send(0xe0, 0x48, 0x00, 0x00, buffer).then((result) => {
    if (result.length > 0) {
      result[0] = 0x30;
      return result.slice(0, result.length - 2);
    }

    return result;
  });
}
