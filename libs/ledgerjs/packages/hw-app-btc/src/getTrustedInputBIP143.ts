import Transport from "@ledgerhq/hw-transport";
import { sha256 } from "@noble/hashes/sha256";
import type { Transaction } from "./types";
import { serializeTransaction } from "./serializeTransaction";
export function getTrustedInputBIP143(
  transport: Transport,
  indexLookup: number,
  transaction: Transaction,
  additionals: Array<string> = [],
): string {
  if (!transaction) {
    throw new Error("getTrustedInputBIP143: missing tx");
  }

  const isDecred = additionals.includes("decred");

  if (isDecred) {
    throw new Error("Decred does not implement BIP143");
  }

  let hash = Buffer.from(sha256(sha256(serializeTransaction(transaction, true))));
  const data = Buffer.alloc(4);
  data.writeUInt32LE(indexLookup, 0);
  const { outputs, locktime } = transaction;

  if (!outputs || !locktime) {
    throw new Error("getTrustedInputBIP143: locktime & outputs is expected");
  }

  if (!outputs[indexLookup]) {
    throw new Error("getTrustedInputBIP143: wrong index");
  }

  hash = Buffer.concat([hash, data, outputs[indexLookup].amount]);
  return hash.toString("hex");
}
