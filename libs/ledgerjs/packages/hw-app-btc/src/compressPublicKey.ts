export function compressPublicKey(publicKey: Buffer): Buffer {
  const prefix = (publicKey[64] & 1) !== 0 ? 0x03 : 0x02;
  const prefixBuffer = Buffer.alloc(1);
  prefixBuffer[0] = prefix;
  return Buffer.concat([prefixBuffer, publicKey.slice(1, 1 + 32)]);
}
