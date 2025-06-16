/**
 * Major functions of this file have been taken from https://github.com/LedgerHQ/app-solana/blob/develop/examples/example-sign.js
 * Thus, have not been fully tested (unit tests + manual tests)
 * We should add more tests in the future
 */

import { PublicKey } from "@solana/web3.js";

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 15 * 1024 - 40 - 8;
const LEGACY_OFFCM_MAX_LEDGER_LEN = 1280 - 40 - 8;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

const MAX_PRINTABLE_ASCII = 0x7e;
const MIN_PRINTABLE_ASCII = 0x20;
const LINE_FEED_ASCII = 0x0a;
function isPrintableASCII(buffer: Buffer, isLegacy: boolean) {
  return buffer.every(element => {
    return (
      // The solana app was not allowing new lines as ascii
      // and would treat the message as UTF-8 (requiring blind signing)
      (!isLegacy && element === LINE_FEED_ASCII) ||
      (MIN_PRINTABLE_ASCII <= element && element <= MAX_PRINTABLE_ASCII)
    );
  });
}

function isUTF8(buffer: Buffer) {
  try {
    new TextDecoder("utf8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function findMessageFormat(messageBuffer: Buffer, isLegacy: boolean): number {
  const maxLedgerLen = isLegacy ? LEGACY_OFFCM_MAX_LEDGER_LEN : OFFCM_MAX_LEDGER_LEN;

  if (messageBuffer.length <= maxLedgerLen) {
    if (isPrintableASCII(messageBuffer, isLegacy)) {
      return 0;
    } else if (isUTF8(messageBuffer)) {
      return 1;
    }
  } else if (messageBuffer.length <= OFFCM_MAX_V0_LEN) {
    if (isUTF8(messageBuffer)) {
      return 2;
    }
  }
  return 0;
}

/**
 * 1. Signing domain (16 bytes)
 * 2. Header version (1 byte)
 * 3. Application domain (32 bytes)
 * 4. Message format (1 byte)
 * 5. Signer count (1 bytes)
 * 6. Signers (signer_count *  32 bytes) - assume that only one signer is present
 * 7. Message length (2 bytes)
 */
const signingDomain = Buffer.concat([Buffer.from([255]), Buffer.from("solana offchain")]);
const headerVersion = Buffer.alloc(1);
const applicationDomain = Buffer.alloc(32);
const messageFormat = Buffer.alloc(1);
const signerCount = Buffer.alloc(1);
signerCount.writeUInt8(1);
const messageLength = Buffer.alloc(2);
export function toOffChainMessage(
  message: string,
  signerAddress: string,
  isLegacy: boolean,
): Buffer {
  const messageBuffer = Buffer.from(message);

  messageFormat.writeUInt8(findMessageFormat(messageBuffer, isLegacy));

  const signers = new PublicKey(signerAddress).toBuffer();

  messageLength.writeUint16LE(messageBuffer.length);

  return Buffer.concat(
    isLegacy
      ? [signingDomain, headerVersion, messageFormat, messageLength, messageBuffer]
      : [
          signingDomain,
          headerVersion,
          applicationDomain,
          messageFormat,
          signerCount,
          signers,
          messageLength,
          messageBuffer,
        ],
  );
}
