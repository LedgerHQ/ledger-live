import type { Transaction } from "./types";
import { createVarint } from "./varint";

/**
  @example
const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
const outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');
  */
export function serializeTransactionOutputs({ outputs }: Transaction): Buffer {
  let outputBuffer = Buffer.alloc(0);

  if (typeof outputs !== "undefined") {
    outputBuffer = Buffer.concat([outputBuffer, createVarint(outputs.length)]);
    outputs.forEach((output) => {
      outputBuffer = Buffer.concat([
        outputBuffer,
        output.amount,
        createVarint(output.script.length),
        output.script,
      ]);
    });
  }

  return outputBuffer;
}
export function serializeTransaction(
  transaction: Transaction,
  skipWitness: boolean,
  timestamp?: Buffer,
  additionals: string[] = []
) {
  const isDecred = additionals.includes("decred");
  const isBech32 = additionals.includes("bech32");
  let inputBuffer = Buffer.alloc(0);
  const useWitness =
    typeof transaction["witness"] != "undefined" && !skipWitness;
  transaction.inputs.forEach((input) => {
    inputBuffer =
      isDecred || isBech32
        ? Buffer.concat([
            inputBuffer,
            input.prevout,
            Buffer.from([0x00]), //tree
            input.sequence,
          ])
        : Buffer.concat([
            inputBuffer,
            input.prevout,
            createVarint(input.script.length),
            input.script,
            input.sequence,
          ]);
  });
  let outputBuffer = serializeTransactionOutputs(transaction);

  if (
    typeof transaction.outputs !== "undefined" &&
    typeof transaction.locktime !== "undefined"
  ) {
    outputBuffer = Buffer.concat([
      outputBuffer,
      (useWitness && transaction.witness) || Buffer.alloc(0),
      transaction.locktime,
      transaction.nExpiryHeight || Buffer.alloc(0),
      transaction.extraData || Buffer.alloc(0),
    ]);
  }

  return Buffer.concat([
    transaction.version,
    timestamp ? timestamp : Buffer.alloc(0),
    transaction.nVersionGroupId || Buffer.alloc(0),
    useWitness ? Buffer.from("0001", "hex") : Buffer.alloc(0),
    createVarint(transaction.inputs.length),
    inputBuffer,
    outputBuffer,
  ]);
}
