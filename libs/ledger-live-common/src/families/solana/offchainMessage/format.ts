/**
 * Major functions of this file have been taken from https://github.com/LedgerHQ/app-solana/blob/develop/examples/example-sign.js
 * Thus, have not been fully tested (unit tests + manual tests)
 * We should add more tests in the future
 */

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 1212;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

const SOLANA_HEADER_BUFFER = Buffer.concat([Buffer.from([255]), Buffer.from("solana offchain")]);

function isPrintableASCII(buffer) {
  return (
    buffer &&
    buffer.every(element => {
      return element >= 0x20 && element <= 0x7e;
    })
  );
}

function isUTF8(buffer: string) {
  try {
    new TextDecoder("utf8", { fatal: true }).decode(Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

function findMessageFormat(message: string): number | undefined {
  if (Object.prototype.toString.call(message) !== "[object Uint8Array]") {
    if (isUTF8(message)) {
      return 1;
    }
    return undefined;
  }
  if (message.length <= OFFCM_MAX_LEDGER_LEN) {
    if (isPrintableASCII(message)) {
      return 0;
    } else if (isUTF8(message)) {
      return 1;
    }
  } else if (message.length <= OFFCM_MAX_V0_LEN) {
    if (isUTF8(message)) {
      return 2;
    }
  }
  return undefined;
}

function writeMessageLength(buffer: Buffer, length: number, offset: number): void {
  buffer.writeUInt16LE(length, offset);
}

function writeMessageFormat(message: string, buffer: Buffer, offset: number): number {
  const messageFormat = findMessageFormat(message) ?? 0;
  return buffer.writeUInt8(messageFormat, offset);
}

function writeVersion(buffer: Buffer): number {
  return buffer.writeUInt8(0);
}

function toMessageInformation(message: string): Buffer {
  const buffer = Buffer.alloc(4);
  let offset = writeVersion(buffer);
  offset = writeMessageFormat(message, buffer, offset);
  writeMessageLength(buffer, Buffer.from(message).length, offset);
  return buffer;
}

export function toOffChainMessage(message: string): Buffer {
  return Buffer.concat([SOLANA_HEADER_BUFFER, toMessageInformation(message), Buffer.from(message)]);
}
