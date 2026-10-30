import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { fetchEncodedBlock } from "../network/api";

const NANOS_PER_MILLI = 1_000_000n;

// Protobuf wire types used by the ledger's Block message.
const VARINT = 0;
const LENGTH_DELIMITED = 2;

type Field = bigint | Uint8Array;

function readVarint(bytes: Uint8Array, offset: number): [bigint, number] {
  let value = 0n;
  let shift = 0n;
  let pos = offset;
  for (;;) {
    if (pos >= bytes.length) throw new Error("[ICP](decodeBlock) Truncated varint");
    const byte = bytes[pos++];
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return [value, pos];
    shift += 7n;
  }
}

// One message level: the values of each field number, in wire order.
function readFields(bytes: Uint8Array): Map<number, Field[]> {
  const fields = new Map<number, Field[]>();
  let pos = 0;
  while (pos < bytes.length) {
    const [key, afterKey] = readVarint(bytes, pos);
    const fieldNumber = Number(key >> 3n);
    const wireType = Number(key & 7n);
    let value: Field;
    if (wireType === VARINT) {
      [value, pos] = readVarint(bytes, afterKey);
    } else if (wireType === LENGTH_DELIMITED) {
      const [length, afterLength] = readVarint(bytes, afterKey);
      pos = afterLength + Number(length);
      if (pos > bytes.length) throw new Error("[ICP](decodeBlock) Truncated field");
      value = bytes.subarray(afterLength, pos);
    } else {
      throw new Error(`[ICP](decodeBlock) Unexpected wire type ${wireType}`);
    }
    fields.set(fieldNumber, [...(fields.get(fieldNumber) ?? []), value]);
  }
  return fields;
}

const firstBytes = (fields: Map<number, Field[]>, n: number): Uint8Array | undefined => {
  const value = fields.get(n)?.[0];
  return value instanceof Uint8Array ? value : undefined;
};

const firstVarint = (fields: Map<number, Field[]>, n: number): bigint | undefined => {
  const value = fields.get(n)?.[0];
  return typeof value === "bigint" ? value : undefined;
};

/**
 * Block metadata from the ledger's protobuf-encoded block (ic_ledger.pb.v1.Block:
 * `parent_hash = 1` as `Hash { bytes hash = 1 }`, `timestamp = 2` as
 * `TimeStamp { uint64 timestamp_nanos = 1 }`). A block's hash is the SHA-256 of its encoding, which
 * is what the next block carries as its parent hash.
 */
export function toBlockInfo(height: number, encoded: Uint8Array): BlockInfo {
  const block = readFields(encoded);

  const timestamp = firstBytes(block, 2);
  const nanos = timestamp && firstVarint(readFields(timestamp), 1);
  if (nanos === undefined) throw new Error("[ICP](decodeBlock) Block has no timestamp");

  const parentHashMessage = firstBytes(block, 1);
  const parentHash = parentHashMessage && firstBytes(readFields(parentHashMessage), 1);

  return {
    height,
    hash: bytesToHex(sha256(encoded)),
    time: new Date(Number(nanos / NANOS_PER_MILLI)),
    ...(parentHash && { parent: { height: height - 1, hash: bytesToHex(parentHash) } }),
  };
}

/** Metadata of the block at `height`, read from the ledger or from the archive that holds it. */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  const encoded = await fetchEncodedBlock(BigInt(height));
  if (!encoded) throw new Error(`[ICP](getBlockInfo) No block at height ${height}`);
  return toBlockInfo(height, encoded);
}
