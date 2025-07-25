import { log } from "@ledgerhq/logs";
import type {
  Transaction,
  TransactionInput,
  TransactionOutput,
  SaplingData,
  SaplingSpendDescriptionV5,
  SaplingOutputDescriptionV5,
  OrchardAction,
  OrchardData,
} from "./types";
import { getVarint } from "./varint";
import { formatTransactionDebug } from "./debug";
import {
  zCashOutCiphertextSize,
  zCashEncCiphertextSize,
  zCashProofsSaplingSize,
} from "./constants";

export function splitTransaction(
  transactionHex: string,
  isSegwitSupported: boolean | null | undefined = false,
  hasExtraData = false,
  additionals: Array<string> = [],
): Transaction {
  const inputs: TransactionInput[] = [];
  const outputs: TransactionOutput[] = [];
  let witness = false;
  let offset = 0;
  const timestamp = Buffer.alloc(0);
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
    isSegwitSupported &&
    transaction[offset] === 0 &&
    transaction[offset + 1] !== 0 &&
    !isZencash
  ) {
    offset += 2;
    witness = true;
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

  let sapling: SaplingData | undefined;
  let orchard: OrchardData | undefined;
  if (hasExtraData) {
    if (isZcashv5) {
      ({ sapling, offset } = splitSaplingPart(transaction, offset));

      ({ orchard, offset } = splitOrchardPart(transaction, offset));

      extraData = transaction.subarray(offset);
    }
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
    if (!isZcashv5) {
      extraData = transaction.slice(offset);
    }
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
    sapling,
    orchard,
  };
  log("btc", `splitTransaction ${transactionHex}:\n${formatTransactionDebug(t)}`);
  return t;
}

/**
 * Splits the Sapling part of a Zcash v5 transaction buffer according to https://zips.z.cash/zip-0225
 */
function splitSaplingPart(
  transaction: Buffer,
  offset: number,
): { sapling?: SaplingData; offset: number } {
  let varint = getVarint(transaction, offset);
  const nSpendsSapling = varint[0];
  offset += varint[1];

  const vSpendsSapling: SaplingSpendDescriptionV5[] = [];
  for (let i = 0; i < nSpendsSapling; i++) {
    const cv = transaction.slice(offset, offset + 32);
    offset += 32;
    const nullifier = transaction.slice(offset, offset + 32);
    offset += 32;
    const rk = transaction.slice(offset, offset + 32);
    offset += 32;

    vSpendsSapling.push({
      cv,
      nullifier,
      rk,
    } as SaplingSpendDescriptionV5);
  }

  varint = getVarint(transaction, offset);
  const nOutputsSapling = varint[0];
  offset += varint[1];
  const vOutputSapling: SaplingOutputDescriptionV5[] = [];

  for (let i = 0; i < nOutputsSapling; i++) {
    const cv = transaction.slice(offset, offset + 32);

    offset += 32;
    const cmu = transaction.slice(offset, offset + 32);

    offset += 32;
    const ephemeralKey = transaction.slice(offset, offset + 32);
    offset += 32;

    const encCiphertext = transaction.slice(offset, offset + zCashEncCiphertextSize);
    offset += zCashEncCiphertextSize;

    const outCiphertext = transaction.slice(offset, offset + zCashOutCiphertextSize);
    offset += zCashOutCiphertextSize;

    vOutputSapling.push({
      cv,
      cmu,
      ephemeralKey,
      encCiphertext,
      outCiphertext,
    } as SaplingOutputDescriptionV5);
  }

  let valueBalanceSapling = Buffer.alloc(0);
  if (nSpendsSapling + nOutputsSapling > 0) {
    valueBalanceSapling = transaction.slice(offset, offset + 8);
    offset += 8;
  }

  let anchorSapling = Buffer.alloc(0);
  if (nSpendsSapling > 0) {
    anchorSapling = transaction.slice(offset, offset + 32);
    offset += 32;
  }

  let vSpendProofsSapling = Buffer.alloc(0);
  let vSpendAuthSigsSapling = Buffer.alloc(0);
  if (nSpendsSapling > 0) {
    vSpendProofsSapling = transaction.slice(
      offset,
      offset + zCashProofsSaplingSize * nSpendsSapling,
    );
    offset += zCashProofsSaplingSize * nSpendsSapling;

    vSpendAuthSigsSapling = transaction.slice(offset, offset + 64 * nSpendsSapling);
    offset += 64 * nSpendsSapling;
  }

  let vOutputProofsSapling = Buffer.alloc(0);
  if (nOutputsSapling > 0) {
    vOutputProofsSapling = transaction.slice(
      offset,
      offset + zCashProofsSaplingSize * nOutputsSapling,
    );
    offset += zCashProofsSaplingSize * nOutputsSapling;
  }

  let bindingSigSapling = Buffer.alloc(0);
  if (nSpendsSapling + nOutputsSapling > 0) {
    bindingSigSapling = transaction.slice(offset, offset + 64);
    offset += 64;
  }

  let sapling: SaplingData | undefined;
  if (nSpendsSapling + nOutputsSapling > 0) {
    sapling = {
      nSpendsSapling,
      vSpendsSapling,
      nOutputsSapling,
      vOutputSapling,
      valueBalanceSapling,
      anchorSapling,
      vSpendProofsSapling,
      vSpendAuthSigsSapling,
      vOutputProofsSapling,
      bindingSigSapling,
    } as SaplingData;
  }

  return { sapling, offset };
}

/**
 * Splits the Orchard part of a Zcash v5 transaction buffer according to https://zips.z.cash/zip-0225
 */
function splitOrchardPart(
  transaction: Buffer,
  offset: number,
): { orchard?: OrchardData; offset: number } {
  // orchard
  let varint = getVarint(transaction, offset);
  const nActionsOrchard = varint[0];
  offset += varint[1];

  let orchard: OrchardData | undefined;
  if (nActionsOrchard > 0) {
    const actionsOrchard: OrchardAction[] = [];

    for (let i = 0; i < nActionsOrchard; i++) {
      const cv = transaction.subarray(offset, offset + 32);
      offset += 32;
      const nullifier = transaction.subarray(offset, offset + 32);
      offset += 32;
      const rk = transaction.subarray(offset, offset + 32);
      offset += 32;
      const cmx = transaction.subarray(offset, offset + 32);
      offset += 32;
      const ephemeralKey = transaction.subarray(offset, offset + 32);
      offset += 32;
      const encCiphertext = transaction.subarray(offset, offset + zCashEncCiphertextSize);
      offset += zCashEncCiphertextSize;
      const outCiphertext = transaction.subarray(offset, offset + zCashOutCiphertextSize);
      offset += zCashOutCiphertextSize;

      const action: OrchardAction = {
        cv,
        nullifier,
        rk,
        cmx,
        ephemeralKey,
        encCiphertext,
        outCiphertext,
      };

      actionsOrchard.push(action);
    }

    // flag field
    const flagsOrchard = transaction.subarray(offset, offset + 1);
    offset += 1;
    // value balance orchard
    const valueBalanceOrchard = transaction.subarray(offset, offset + 8);
    offset += 8;

    const anchorOrchard = transaction.subarray(offset, offset + 32);
    offset += 32;

    // read the size of proof
    varint = getVarint(transaction, offset);
    const sizeProofsOrchard = transaction.subarray(offset, offset + varint[1]);
    offset += varint[1];

    // proof field
    const proofsOrchard = transaction.subarray(offset, offset + varint[0]);
    offset += varint[0];

    // vSpendAuthSigsOrchard field
    const vSpendAuthSigsOrchard = transaction.subarray(offset, offset + nActionsOrchard * 64);
    offset += nActionsOrchard * 64;

    // bindingSigOrchard
    const bindingSigOrchard = transaction.subarray(offset, offset + 64);
    offset += 64;

    orchard = {
      vActions: actionsOrchard,
      flags: flagsOrchard,
      valueBalance: valueBalanceOrchard,
      anchor: anchorOrchard,
      sizeProofs: sizeProofsOrchard,
      proofs: proofsOrchard,
      vSpendsAuthSigs: vSpendAuthSigsOrchard,
      bindingSig: bindingSigOrchard,
    } as OrchardData;
  }

  return { orchard, offset };
}
