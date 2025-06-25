import invariant from "invariant";
import type Transport from "@ledgerhq/hw-transport";
import type { Transaction } from "./types";
import { MAX_SCRIPT_BLOCK } from "./constants";
import { createVarint } from "./varint";
export async function getTrustedInputRaw(
  transport: Transport,
  transactionData: Buffer,
  indexLookup?: number | null | undefined,
): Promise<string> {
  let data;
  let firstRound = false;

  if (typeof indexLookup === "number") {
    firstRound = true;
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(indexLookup, 0);
    data = Buffer.concat([prefix, transactionData], transactionData.length + 4);
  } else {
    data = transactionData;
  }

  const trustedInput = await transport.send(0xe0, 0x42, firstRound ? 0x00 : 0x80, 0x00, data);
  const res = trustedInput.slice(0, trustedInput.length - 2).toString("hex");
  return res;
}
export async function getTrustedInput(
  transport: Transport,
  indexLookup: number,
  transaction: Transaction,
  additionals: Array<string> = [],
): Promise<string> {
  const { inputs, outputs, locktime, nExpiryHeight, extraData } = transaction;

  if (!outputs || !locktime) {
    throw new Error("getTrustedInput: locktime & outputs is expected");
  }

  const isDecred = additionals.includes("decred");

  const processScriptBlocks = async (script, sequence?: Buffer) => {
    const seq = sequence || Buffer.alloc(0);
    const scriptBlocks: Buffer[] = [];
    let offset = 0;

    while (offset !== script.length) {
      const blockSize =
        script.length - offset > MAX_SCRIPT_BLOCK ? MAX_SCRIPT_BLOCK : script.length - offset;

      if (offset + blockSize !== script.length) {
        scriptBlocks.push(script.slice(offset, offset + blockSize));
      } else {
        scriptBlocks.push(Buffer.concat([script.slice(offset, offset + blockSize), seq]));
      }

      offset += blockSize;
    }

    // Handle case when no script length: we still want to pass the sequence
    // relatable: https://github.com/LedgerHQ/ledger-live-desktop/issues/1386
    if (script.length === 0) {
      scriptBlocks.push(seq);
    }

    let res;

    for (const scriptBlock of scriptBlocks) {
      res = await getTrustedInputRaw(transport, scriptBlock);
    }

    return res;
  };

  const processWholeScriptBlock = block => getTrustedInputRaw(transport, block);

  const isZcash = additionals.includes("zcash");
  // NOTE: this isn't necessary as consensusBranchId is only set when the transaction is a zcash tx
  // but better safe than sorry
  const zCashConsensusBranchId = transaction.consensusBranchId || Buffer.alloc(0);

  console.log("rabl: getTrustedInput HERE 1", {
    version: transaction.version,
    timestamp: transaction.timestamp,
    nVersionGroupId: transaction.nVersionGroupId,
    isZcash,
    zCashConsensusBranchId,
    inputsLength: inputs.length,
  });

  await getTrustedInputRaw(
    transport,
    Buffer.concat([
      transaction.version,
      transaction.timestamp || Buffer.alloc(0),
      transaction.nVersionGroupId || Buffer.alloc(0),
      isZcash ? zCashConsensusBranchId : Buffer.alloc(0),
      createVarint(inputs.length),
    ]),
    indexLookup,
  );

  for (const input of inputs) {
    const treeField = isDecred ? input.tree || Buffer.from([0x00]) : Buffer.alloc(0);
    const data = Buffer.concat([input.prevout, treeField, createVarint(input.script.length)]);
    await getTrustedInputRaw(transport, data);
    // iteration (eachSeries) ended
    // TODO notify progress
    // deferred.notify("input");
    await (isDecred
      ? processWholeScriptBlock(Buffer.concat([input.script, input.sequence]))
      : processScriptBlocks(input.script, input.sequence));
  }
  await getTrustedInputRaw(transport, createVarint(outputs.length));

  for (const output of outputs) {
    const data = Buffer.concat([
      output.amount,
      isDecred ? Buffer.from([0x00, 0x00]) : Buffer.alloc(0), //Version script
      createVarint(output.script.length),
      output.script,
    ]);
    console.log("rabl: getTrustedInput HERE 6", { data });
    await getTrustedInputRaw(transport, data);
  }

  if (isZcash && transaction.sapling) {
    const data = Buffer.concat([
      locktime,
      Buffer.from([0x01, 0x00, 0x00, 0x00]),
      transaction.sapling.valueBalanceSapling,
      transaction.sapling.anchorSapling,
      createVarint(transaction.sapling.vSpendsSapling.length),
      createVarint(transaction.sapling.vOutputSapling.length),
    ]);

    console.log("rabl: start EXTRA DATA", { data });
    // send this is sapling data
    await getTrustedInputRaw(transport, data);
    // // send spends
    for (const spend of transaction.sapling.vSpendsSapling) {
      const spendData = Buffer.concat([
        spend.cv,
        spend.anchor,
        spend.nullifier,
        spend.rk,
        createVarint(spend.zkproof.length),
        spend.zkproof,
      ]);
      console.log("rabl: getTrustedInput HERE 6.1", { spendData });
      await getTrustedInputRaw(transport, spendData);
    }
    // await getTrustedInputRaw(transport, data);
    // // send outputs
    for (const output of transaction.sapling.vOutputSapling) {
      const outputData = Buffer.concat([
        output.cv,
        output.cmu,
        output.ephemeralKey,
        output.encCiphertext,
        createVarint(output.zkproof.length),
        output.zkproof,
      ]);
      console.log("rabl: getTrustedInput HERE 6.2", { outputData });
      await getTrustedInputRaw(transport, outputData);
    }
    // await getTrustedInputRaw(transport, data);
    // // send other
    // await getTrustedInputRaw(transport, data);
  }

  const endData: Buffer[] = [];

  if (nExpiryHeight && nExpiryHeight.length > 0) {
    endData.push(nExpiryHeight);
  }

  if (extraData && extraData.length > 0) {
    endData.push(extraData);
  }

  let extraPart;

  if (endData.length) {
    const data = Buffer.concat(endData);
    extraPart = isDecred ? data : Buffer.concat([createVarint(data.length), data]);
  }

  const res = await processScriptBlocks(Buffer.concat([locktime, extraPart || Buffer.alloc(0)]));
  invariant(res, "missing result in processScriptBlocks");
  return res;
}
