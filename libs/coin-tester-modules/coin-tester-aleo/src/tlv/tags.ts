/** Tag numbers from `aleo-backend/src/core/tlv.rs` (`TlvTag`). */
export const TLV_TAG = {
  StructureType: 0x01,
  Version: 0x02,
  Signature: 0x15,
  MaxBaseFee: 0xb0,
  MaxPriorityFee: 0xb1,
  FeeFunctionName: 0xb2,
  FeeProgramId: 0xb3,
  Request: 0xb4,
  ProgramId: 0xb5,
  FunctionName: 0xb6,
  InputCount: 0xb7,
  InputValues: 0xb8,
  InputTypes: 0xb9,
  NestedCallCount: 0xba,
  Tvk: 0xbf,
  Tpk: 0xc0,
  GammasCount: 0xc1,
  Gammas: 0xc2,
  NetworkId: 0xc3,
  ProgramChecksum: 0xc4,
} as const;

const KNOWN_TAGS: ReadonlySet<number> = new Set(Object.values(TLV_TAG));

/** `StructureType` discriminants: root wrapper, request, signature. */
export const STRUCTURE_TYPE = {
  Root: 0x28,
  Request: 0x29,
  Signature: 0x2a,
} as const;

export const TLV_VERSION_V1 = 0x01;

/** Varint prefixes: `0x81` for [128,255], `0x82` for a big-endian u16. */
export const VARINT_PREFIX_LOW = 0x81;
export const VARINT_PREFIX_HIGH = 0x82;

/** `LiteralType` discriminants, in the snarkVM 4.5.4 order (tlv.rs:157-175). */
export const LITERAL_TYPE_BY_BYTE: Readonly<Record<number, string>> = {
  0x00: "address",
  0x01: "boolean",
  0x02: "field",
  0x03: "group",
  0x04: "i8",
  0x05: "i16",
  0x06: "i32",
  0x07: "i64",
  0x08: "i128",
  0x09: "u8",
  0x0a: "u16",
  0x0b: "u32",
  0x0c: "u64",
  0x0d: "u128",
  0x0e: "scalar",
  0x0f: "signature",
  0x10: "string",
};

/** `ValueType` discriminants that carry a plaintext type (tlv.rs:498-529). */
export const VISIBILITY_BY_BYTE: Readonly<Record<number, string>> = {
  0x00: "constant",
  0x01: "public",
  0x02: "private",
};

/**
 * `ValueType::Record` discriminant. The type TLV continues with a 1-byte
 * length and the record name's ASCII bytes (`get_input_type_bytes`,
 * tlv.rs:515-521); the matching `InputValues` entry is 96 bytes — a 32-byte
 * commitment followed by the 64-byte h-generator (x, y) coordinates
 * (`encode_input_value`, tlv.rs:568-581).
 */
export const VALUE_TYPE_RECORD = 0x03;
export const VALUE_TYPE_EXTERNAL_RECORD = 0x04;

export function isKnownTag(tag: number): boolean {
  return KNOWN_TAGS.has(tag);
}

/** Mirrors the Rust `encode_length` / `From<TlvTag> for Vec<u8>`. */
export function encodeVarInt(value: number): number[] {
  if (value <= 127) return [value];
  if (value <= 255) return [VARINT_PREFIX_LOW, value];
  return [VARINT_PREFIX_HIGH, (value >> 8) & 0xff, value & 0xff];
}

export function encodeTlv(tag: number, value: Uint8Array | number[]): number[] {
  const bytes = Array.from(value);
  return [...encodeVarInt(tag), ...encodeVarInt(bytes.length), ...bytes];
}

function readVarInt(bytes: Uint8Array, offset: number): { value: number; next: number } {
  if (offset >= bytes.length) {
    throw new Error("aleo coin-tester: unexpected end of TLV data");
  }
  const first = bytes[offset];
  if (first === VARINT_PREFIX_LOW) {
    if (offset + 1 >= bytes.length) {
      throw new Error("aleo coin-tester: unexpected end of TLV data");
    }
    return { value: bytes[offset + 1], next: offset + 2 };
  }
  if (first === VARINT_PREFIX_HIGH) {
    if (offset + 2 >= bytes.length) {
      throw new Error("aleo coin-tester: unexpected end of TLV data");
    }
    return { value: (bytes[offset + 1] << 8) | bytes[offset + 2], next: offset + 3 };
  }
  return { value: first, next: offset + 1 };
}

export function readTlv(
  bytes: Uint8Array,
  offset: number,
): { tag: number; value: Uint8Array; next: number } {
  const tag = readVarInt(bytes, offset);
  const length = readVarInt(bytes, tag.next);
  const end = length.next + length.value;
  if (end > bytes.length) {
    throw new Error(
      `aleo coin-tester: TLV value length exceeds data size (tag 0x${tag.value.toString(16)}, len ${length.value})`,
    );
  }
  return { tag: tag.value, value: bytes.subarray(length.next, end), next: end };
}
