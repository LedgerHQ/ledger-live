import type Transport from "@ledgerhq/hw-transport";
import { getTrustedInput } from "./getTrustedInput";
import { startUntrustedHashTransactionInput } from "./startUntrustedHashTransactionInput";
import { getTrustedInputBIP143 } from "./getTrustedInputBIP143";
import { signTransaction } from "./signTransaction";
import { hashOutputFull } from "./finalizeInput";
import type { TransactionOutput, Transaction, TrustedInput } from "./types";
import { DEFAULT_LOCKTIME, DEFAULT_VERSION, DEFAULT_SEQUENCE, SIGHASH_ALL } from "./constants";
const defaultArg = {
  lockTime: DEFAULT_LOCKTIME,
  sigHashType: SIGHASH_ALL,
  segwit: false,
  transactionVersion: DEFAULT_VERSION,
};

/**
 *
 */
export type SignP2SHTransactionArg = {
  inputs: Array<[Transaction, number, string | null | undefined, number | null | undefined]>;
  associatedKeysets: string[];
  outputScriptHex: string;
  lockTime?: number;
  sigHashType?: number;
  segwit?: boolean;
  transactionVersion?: number;
};
export async function signP2SHTransaction(transport: Transport, arg: SignP2SHTransactionArg) {
  const {
    inputs,
    associatedKeysets,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit,
    transactionVersion,
  } = { ...defaultArg, ...arg };
  // Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
  // associatedKeysets are provided as arrays of [path]
  const nullScript = Buffer.alloc(0);
  const nullPrevout = Buffer.alloc(0);
  const defaultVersion = Buffer.alloc(4);
  defaultVersion.writeUInt32LE(transactionVersion, 0);
  const trustedInputs: TrustedInput[] = [];
  const regularOutputs: Array<TransactionOutput> = [];
  const signatures: string[] = [];
  let firstRun = true;
  const resuming = false;
  const targetTransaction: Transaction = {
    inputs: [],
    version: defaultVersion,
  };
  const getTrustedInputCall = segwit ? getTrustedInputBIP143 : getTrustedInput;
  const outputScript = Buffer.from(outputScriptHex, "hex");

  for (const input of inputs) {
    if (!resuming) {
      const trustedInput = await getTrustedInputCall(transport, input[1], input[0]);
      const sequence = Buffer.alloc(4);
      sequence.writeUInt32LE(
        input.length >= 4 && typeof input[3] === "number" ? input[3] : DEFAULT_SEQUENCE,
        0,
      );
      trustedInputs.push({
        trustedInput: false,
        value: segwit
          ? Buffer.from(trustedInput, "hex")
          : Buffer.from(trustedInput, "hex").slice(4, 4 + 0x24),
        sequence,
      });
    }

    const { outputs } = input[0];
    const index = input[1];

    if (outputs && index <= outputs.length - 1) {
      regularOutputs.push(outputs[index]);
    }
  }

  // Pre-build the target transaction
  for (let i = 0; i < inputs.length; i++) {
    const sequence = Buffer.alloc(4);
    sequence.writeUInt32LE(
      inputs[i].length >= 4 && typeof inputs[i][3] === "number"
        ? (inputs[i][3] as number)
        : DEFAULT_SEQUENCE,
      0,
    );
    targetTransaction.inputs.push({
      script: nullScript,
      prevout: nullPrevout,
      sequence,
    });
  }

  if (segwit) {
    await startUntrustedHashTransactionInput(
      transport,
      true,
      targetTransaction,
      trustedInputs,
      true,
    );
    await hashOutputFull(transport, outputScript);
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const script =
      inputs[i].length >= 3 && typeof input[2] === "string"
        ? Buffer.from(input[2], "hex")
        : regularOutputs[i].script;
    const pseudoTX = Object.assign({}, targetTransaction);
    const pseudoTrustedInputs = segwit ? [trustedInputs[i]] : trustedInputs;

    if (segwit) {
      pseudoTX.inputs = [{ ...pseudoTX.inputs[i], script }];
    } else {
      pseudoTX.inputs[i].script = script;
    }

    await startUntrustedHashTransactionInput(
      transport,
      !segwit && firstRun,
      pseudoTX,
      pseudoTrustedInputs,
      segwit,
    );

    if (!segwit) {
      await hashOutputFull(transport, outputScript);
    }

    const signature = await signTransaction(transport, associatedKeysets[i], lockTime, sigHashType);
    signatures.push(
      segwit ? signature.toString("hex") : signature.slice(0, signature.length - 1).toString("hex"),
    );
    targetTransaction.inputs[i].script = nullScript;

    if (firstRun) {
      firstRun = false;
    }
  }

  return signatures;
}
