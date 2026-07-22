import { sha256 } from "@noble/hashes/sha2";
import cbor from "cbor";

type TransactionHashInput = {
  from: string;
  to: string;
  amount: bigint;
  fee: bigint;
  memo: bigint;
  created_at_time: bigint;
};

// Reproduces the ICP ledger transaction request encoding: the transfer is laid out
// as index-keyed nested CBOR maps, canonically encoded, then SHA-256'd. The result is
// the on-chain transaction identity hash, so the byte layout must not change.
function serializeTransaction({
  from,
  to,
  amount,
  fee,
  memo,
  created_at_time,
}: TransactionHashInput): string {
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
  const mapCreatedAtTime = new Map();
  mapCreatedAtTime.set(0, created_at_time);

  const orderedMap = new Map();
  orderedMap.set(0, mapTransfer);
  orderedMap.set(1, memo);
  orderedMap.set(2, mapCreatedAtTime);

  return cbor.encodeCanonical(orderedMap).toString("hex");
}

export function hashTransaction(input: TransactionHashInput): string {
  const serialized = serializeTransaction(input);
  return Buffer.from(sha256(Buffer.from(serialized, "hex"))).toString("hex");
}
