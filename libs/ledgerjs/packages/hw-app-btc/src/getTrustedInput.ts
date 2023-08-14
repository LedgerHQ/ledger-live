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
  const { version, inputs, outputs, locktime, nExpiryHeight, extraData } = transaction;

  if (!outputs || !locktime) {
    throw new Error("getTrustedInput: locktime & outputs is expected");
  }

  const isDecred = additionals.includes("decred");
  const isXST = additionals.includes("stealthcoin");

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

  await getTrustedInputRaw(
    transport,
    Buffer.concat([
      transaction.version,
      transaction.timestamp || Buffer.alloc(0),
      transaction.nVersionGroupId || Buffer.alloc(0),
      createVarint(inputs.length),
    ]),
    indexLookup,
  );

  for (const input of inputs) {
    const isXSTV2 = isXST && Buffer.compare(version, Buffer.from([0x02, 0x00, 0x00, 0x00])) === 0;
    const treeField = isDecred ? input.tree || Buffer.from([0x00]) : Buffer.alloc(0);
    const data = Buffer.concat([
      input.prevout,
      treeField,
      isXSTV2 ? Buffer.from([0x00]) : createVarint(input.script.length),
    ]);
    await getTrustedInputRaw(transport, data);
    // iteration (eachSeries) ended
    // TODO notify progress
    // deferred.notify("input");
    // Reference: https://github.com/StealthSend/Stealth/commit/5be35d6c2c500b32ed82e5d6913d66d18a4b0a7f#diff-e8db9b851adc2422aadfffca88f14c91R566
    await (isDecred
      ? processWholeScriptBlock(Buffer.concat([input.script, input.sequence]))
      : isXSTV2
      ? processWholeScriptBlock(input.sequence)
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
    await getTrustedInputRaw(transport, data);
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
