import { Transaction } from "bitcoinjs-lib";
import { log } from "@ledgerhq/logs";
import { parseEnvelope } from "./craftTransaction";

const prevTxId = (hash: Buffer): string =>
  Buffer.from(Uint8Array.from(hash)).reverse().toString("hex");

export class SignedTransactionMismatch extends Error {
  override name = "SignedTransactionMismatch";
}

function decode(signedHex: string): Transaction | undefined {
  try {
    return Transaction.fromHex(signedHex);
  } catch {
    // Formats bitcoinjs does not read (Decred, Zcash-like extra data): nothing to compare against.
    return undefined;
  }
}

/**
 * The device returns the whole signed transaction rather than signatures to splice in, so this
 * returns it as is — after checking it spends the envelope inputs and pays its outputs, in order.
 */
export function combine(transaction: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Expected one signed transaction, got ${signature.length}`);
  }
  const [signed] = signature;
  const envelope = parseEnvelope(transaction);
  const tx = decode(signed);
  if (!tx) {
    log("coin-bitcoin", `combine: ${envelope.currency} signed transaction left unchecked`);
    return signed;
  }

  const inputsMatch =
    tx.ins.length === envelope.inputs.length &&
    tx.ins.every(
      (input, i) =>
        prevTxId(input.hash) === envelope.inputs[i].txid &&
        input.index === envelope.inputs[i].outputIndex,
    );
  const outputsMatch =
    tx.outs.length === envelope.outputs.length &&
    tx.outs.every(
      (output, i) =>
        output.script.toString("hex") === envelope.outputs[i].script &&
        BigInt(output.value) === BigInt(envelope.outputs[i].value),
    );
  if (!inputsMatch || !outputsMatch) {
    throw new SignedTransactionMismatch(
      "The signed transaction does not match the transaction to sign",
    );
  }
  return signed;
}
