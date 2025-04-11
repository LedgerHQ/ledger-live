import { isValidUTF8 } from "utf-8-validate";

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 1212;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

function isPrintableASCII(buffer) {
  return (
    buffer &&
    buffer.every(element => {
      return element >= 0x20 && element <= 0x7e;
    })
  );
}

function isUTF8(buffer) {
  return buffer && isValidUTF8(buffer);
}

function guessMessageFormat(message: string) {
  if (Object.prototype.toString.call(message) !== "[object Uint8Array]") {
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

export function toOffChainMessage(message: string): Buffer {
  const buffer = Buffer.alloc(4);
  let offset = buffer.writeUInt8(0);
  const messageFormat = guessMessageFormat(message) ?? 0;
  offset = buffer.writeUInt8(messageFormat, offset);
  buffer.writeUInt16LE(message.length, offset);
  const result = Buffer.concat([
    Buffer.from([255]),
    Buffer.from("solana offchain"),
    buffer,
    Buffer.from(message),
  ]);

  return result;
}
