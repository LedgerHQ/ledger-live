import { BitReader, BitString, Cell, Slice } from "@ton/core";

export function dataToSlice(data: string): Slice | undefined {
  let buffer: Buffer;
  if (typeof data === "string") {
    buffer = Buffer.from(data, "base64");

    try {
      return Cell.fromBoc(buffer)[0].beginParse();
    } catch {
      return new Slice(new BitReader(new BitString(buffer, 0, buffer.length * 8)), []);
    }
  }

  return undefined;
}

export function loadSnakeBytes(slice: Slice): Buffer {
  let buffer = Buffer.alloc(0);

  while (slice.remainingBits >= 8) {
    buffer = Buffer.concat([buffer, slice.loadBuffer(slice.remainingBits / 8)]);
    if (slice.remainingRefs) {
      slice = slice.loadRef().beginParse();
    } else {
      break;
    }
  }

  return buffer;
}

export function decodeForwardPayload(payload: string | null): string {
  if (!payload) return "";

  try {
    const slice = dataToSlice(payload);

    if (!slice) return "";

    const opcode = slice.loadUint(32);

    // Format with opcode 0 followed by text
    if (opcode !== 0) {
      return "";
    }
    const buffer = loadSnakeBytes(slice);
    const comment = buffer.toString("utf-8");

    return comment;
  } catch {
    // Silent failure, returning empty string
    return "";
  }
}
