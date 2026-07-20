/**
 * Major functions of this file have been taken from https://github.com/LedgerHQ/app-solana/blob/develop/examples/example-sign.js
 * Thus, have not been fully tested (unit tests + manual tests)
 * We should add more tests in the future
 */

import { PublicKey } from "@solana/web3.js";

// Max off-chain message length supported by Ledger (= app-solana MAX_OFFCHAIN_MESSAGE_LENGTH)
const OFFCM_MAX_LEDGER_LEN = 15 * 1024 - 40 - 8;
const LEGACY_OFFCM_MAX_LEDGER_LEN = 1280 - 40 - 8;

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
  if (messageBuffer.length > maxLedgerLen) {
    throw new Error(`Message too long: ${messageBuffer.length} bytes (max is ${maxLedgerLen})`);
  }
  if (isPrintableASCII(messageBuffer, isLegacy)) return 0;
  if (isUTF8(messageBuffer)) return 1;
  return 0;
}

const signingDomain = Buffer.concat([Buffer.from([255]), Buffer.from("solana offchain")]);

/**
 * V1 wire format (sRFC 38, per app-solana parser):
 *   signing domain  (16 B): 0xFF + "solana offchain"
 *   version         ( 1 B): 0x01
 *   signer count    ( 1 B): 1
 *   signer          (32 B)
 *   [message length ( 2 B): little-endian uint16] — only when includeLengthPrefix
 *   message body    (variable)
 *
 * The finalised sRFC 38 layout drops the length prefix. `includeLengthPrefix`
 * reproduces the pre-spec-update layout for backward compatibility with older
 * firmware that rejects the no-prefix form with 6a81.
 */
export function toOffChainMessageV1(
  message: string,
  signerAddress: string,
  includeLengthPrefix = false,
): Buffer {
  const messageBuffer = Buffer.from(message);
  if (messageBuffer.length > OFFCM_MAX_LEDGER_LEN) {
    throw new Error(
      `Message too long: ${messageBuffer.length} bytes (max is ${OFFCM_MAX_LEDGER_LEN})`,
    );
  }

  const version = Buffer.from([0x01]);
  const signerCount = Buffer.from([0x01]);
  const signer = new PublicKey(signerAddress).toBuffer();

  if (includeLengthPrefix) {
    const messageLength = Buffer.alloc(2);
    messageLength.writeUInt16LE(messageBuffer.length);
    return Buffer.concat([
      signingDomain,
      version,
      signerCount,
      signer,
      messageLength,
      messageBuffer,
    ]);
  }
  return Buffer.concat([signingDomain, version, signerCount, signer, messageBuffer]);
}

/**
 * V0 wire format:
 *   signing domain  (16 B): 0xFF + "solana offchain"
 *   version         ( 1 B): 0x00
 *   application domain (32 B): zero-padded
 *   format          ( 1 B): 0 = ASCII, 1 = UTF-8
 *   signer count    ( 1 B): 1
 *   signer          (32 B)
 *   message length  ( 2 B): little-endian uint16
 *   message body    (variable)
 *
 * Legacy format (Nano S / old firmware):
 *   signing domain  (16 B)
 *   version         ( 1 B): 0x00
 *   format          ( 1 B)
 *   message length  ( 2 B): always present
 *   message body    (variable)
 */
const v0HeaderVersion = Buffer.alloc(1); // 0x00
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

  messageLength.writeUInt16LE(messageBuffer.length);

  if (isLegacy) {
    return Buffer.concat([
      signingDomain,
      v0HeaderVersion,
      messageFormat,
      messageLength,
      messageBuffer,
    ]);
  }

  return Buffer.concat([
    signingDomain,
    v0HeaderVersion,
    applicationDomain,
    messageFormat,
    signerCount,
    signers,
    messageLength,
    messageBuffer,
  ]);
}
