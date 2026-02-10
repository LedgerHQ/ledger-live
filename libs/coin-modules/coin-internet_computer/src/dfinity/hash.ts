/**
 * Hash and CBOR encoding utilities for Internet Computer transactions
 */
import crypto from "crypto";
import cbor from "cbor";

/**
 * Transaction parameters for hashing
 */
export interface TransactionParams {
  from: string;
  to: string;
  amount: bigint;
  fee: bigint;
  memo: bigint;
  created_at_time: bigint;
}

/**
 * Encodes values using CBOR canonical encoding
 * @param value - Values to encode
 * @returns CBOR encoded buffer
 */
export function encode(...value: any): Buffer {
  const encoder = new cbor.Encoder({ canonical: true });
  return encoder._encodeAll(value);
}

/**
 * Serializes a transaction into a hex string using CBOR encoding
 * @param params - Transaction parameters
 * @returns Hex-encoded serialized transaction
 */
export function serializeTransaction({
  from,
  to,
  amount,
  fee,
  memo,
  created_at_time,
}: TransactionParams): string {
  const orderedMap = new Map();
  const mapAmount = new Map();
  mapAmount.set(0, amount);
  const mapFee = new Map();
  mapFee.set(0, fee);
  const mapOperation = new Map();
  mapOperation.set(0, from);
  mapOperation.set(1, to);
  mapOperation.set(2, mapAmount);
  mapOperation.set(3, mapFee);
  const mapTransfer = new Map();
  mapTransfer.set(2, mapOperation);

  orderedMap.set(0, mapTransfer);

  orderedMap.set(1, memo);

  const mapCreatedAtTime = new Map();
  mapCreatedAtTime.set(0, created_at_time > 0 ? created_at_time : 0);

  orderedMap.set(2, mapCreatedAtTime);

  const serialized = encode(orderedMap);
  const serializedHex = Buffer.from(serialized).toString("hex");
  return serializedHex;
}

/**
 * Hashes a transaction using SHA-256
 * @param params - Transaction parameters
 * @returns Hex-encoded SHA-256 hash of the serialized transaction
 */
export function hashTransaction({
  from,
  to,
  amount,
  fee,
  memo,
  created_at_time,
}: TransactionParams): string {
  const serialized = serializeTransaction({
    from,
    to,
    amount,
    fee,
    memo,
    created_at_time,
  });

  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(serialized, "hex"));
  const hashBuffer = hash.digest();
  return Buffer.from(hashBuffer).toString("hex");
}
