import { log } from "@ledgerhq/logs";
import type { Transaction, TransactionInput, TransactionOutput } from "./types";
import { getVarint } from "./varint";
import { formatTransactionDebug } from "./debug";
export function splitTransaction(
  transactionHex: string,
  isSegwitSupported: boolean | null | undefined = false,
  hasTimestamp = false,
  hasExtraData = false,
  additionals: Array<string> = [],
): Transaction {
  const inputs: TransactionInput[] = [];
  const outputs: TransactionOutput[] = [];
  let witness = false;
  let offset = 0;
  let timestamp = Buffer.alloc(0);
  let nExpiryHeight = Buffer.alloc(0);
  let nVersionGroupId = Buffer.alloc(0);
  let extraData = Buffer.alloc(0);
  let witnessScript, locktime;
  const isDecred = additionals.includes("decred");
  const isZencash = additionals.includes("zencash");
  const isZcash = additionals.includes("zcash");
  const transaction = Buffer.from(transactionHex, "hex");
  const version = transaction.slice(offset, offset + 4);
  const overwinter =
    version.equals(Buffer.from([0x03, 0x00, 0x00, 0x80])) ||
    version.equals(Buffer.from([0x04, 0x00, 0x00, 0x80])) ||
    version.equals(Buffer.from([0x05, 0x00, 0x00, 0x80]));
  const isZcashv5 = isZcash && version.equals(Buffer.from([0x05, 0x00, 0x00, 0x80]));
  offset += 4;
  if (
    !hasTimestamp &&
    isSegwitSupported &&
    transaction[offset] === 0 &&
    transaction[offset + 1] !== 0 &&
    !isZencash
  ) {
    offset += 2;
    witness = true;
  }

  if (hasTimestamp) {
    timestamp = transaction.slice(offset, 4 + offset);
    offset += 4;
  }

  if (overwinter) {
    nVersionGroupId = transaction.slice(offset, 4 + offset);
    offset += 4;
  }
  if (isZcashv5) {
    locktime = transaction.slice(offset + 4, offset + 8);
    nExpiryHeight = transaction.slice(offset + 8, offset + 12);
    offset += 12;
  }
  let varint = getVarint(transaction, offset);
  const numberInputs = varint[0];
  offset += varint[1];

  for (let i = 0; i < numberInputs; i++) {
    const prevout = transaction.slice(offset, offset + 36);
    offset += 36;
    let script = Buffer.alloc(0);
    let tree = Buffer.alloc(0);

    //No script for decred, it has a witness
    if (!isDecred) {
      varint = getVarint(transaction, offset);
      offset += varint[1];
      script = transaction.slice(offset, offset + varint[0]);
      offset += varint[0];
    } else {
      //Tree field
      tree = transaction.slice(offset, offset + 1);
      offset += 1;
    }

    const sequence = transaction.slice(offset, offset + 4);
    offset += 4;
    inputs.push({
      prevout,
      script,
      sequence,
      tree,
    });
  }
  varint = getVarint(transaction, offset);
  const numberOutputs = varint[0];
  offset += varint[1];
  for (let i = 0; i < numberOutputs; i++) {
    const amount = transaction.slice(offset, offset + 8);
    offset += 8;

    if (isDecred) {
      //Script version
      offset += 2;
    }

    varint = getVarint(transaction, offset);
    offset += varint[1];
    const script = transaction.slice(offset, offset + varint[0]);
    offset += varint[0];
    outputs.push({
      amount,
      script,
    });
  }

  if (witness) {
    witnessScript = transaction.slice(offset, -4);
    locktime = transaction.slice(transaction.length - 4);
  } else if (!isZcashv5) {
    locktime = transaction.slice(offset, offset + 4);
  }

  offset += 4;

  if ((overwinter || isDecred) && !isZcashv5) {
    nExpiryHeight = transaction.slice(offset, offset + 4);
    offset += 4;
  }

  if (hasExtraData) {
    extraData = transaction.slice(offset);
  }

  //Get witnesses for Decred
  if (isDecred) {
    varint = getVarint(transaction, offset);
    offset += varint[1];

    if (varint[0] !== numberInputs) {
      throw new Error("splitTransaction: incoherent number of witnesses");
    }

    for (let i = 0; i < numberInputs; i++) {
      //amount
      offset += 8;
      //block height
      offset += 4;
      //block index
      offset += 4;
      //Script size
      varint = getVarint(transaction, offset);
      offset += varint[1];
      const script = transaction.slice(offset, offset + varint[0]);
      offset += varint[0];
      inputs[i].script = script;
    }
  }

  const t: Transaction = {
    version,
    inputs,
    outputs,
    locktime,
    witness: witnessScript,
    timestamp,
    nVersionGroupId,
    nExpiryHeight,
    extraData,
  };
  log("btc", `splitTransaction ${transactionHex}:\n${formatTransactionDebug(t)}`);
  return t;
}
