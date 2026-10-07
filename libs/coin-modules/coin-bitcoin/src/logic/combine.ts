import { Psbt, Transaction, payments, script as bscript } from "bitcoinjs-lib";
import { getNetworkParameters } from "../networks";
import { sameBytes } from "./bytes";
import { compressPublicKey } from "./publicKey";
import { DerivationModes, derivationModeOf } from "./selectUtxos";
import { signedRequestMismatch } from "./signedRequestTransaction";
import { parseSigningRequest } from "./signingRequest";

const HEX = /^(?:[0-9a-fA-F]{2})+$/;

/**
 * Whether `signed` is the crafted transaction: same version and locktime, exactly the crafted inputs
 * with their sequences (which carry the RBF signal), exactly the crafted outputs.
 */
function sameTransaction(signed: Transaction, crafted: Psbt): boolean {
  const inputs = crafted.txInputs;
  const outputs = crafted.txOutputs;
  return (
    signed.version === crafted.version &&
    signed.locktime === crafted.locktime &&
    signed.ins.length === inputs.length &&
    signed.outs.length === outputs.length &&
    signed.ins.every(
      (input, i) =>
        sameBytes(input.hash, inputs[i].hash) &&
        input.index === inputs[i].index &&
        input.sequence === (inputs[i].sequence ?? Transaction.DEFAULT_SEQUENCE),
    ) &&
    signed.outs.every(
      (output, i) =>
        sameBytes(output.script, outputs[i].script) && output.value === outputs[i].value,
    )
  );
}

function parseTransaction(value: string): Transaction | undefined {
  try {
    return Transaction.fromHex(value);
  } catch {
    return undefined;
  }
}

/**
 * Whether `signature` is a DER-encoded ECDSA signature followed by the currency's sighash type
 * byte. Structural only: the node verifies the signature itself.
 */
function isEcdsaSignature(signature: Buffer, sigHashType: number): boolean {
  return (
    signature.length >= 9 &&
    signature.length <= 73 &&
    signature[0] === 0x30 &&
    signature[1] === signature.length - 3 &&
    signature[signature.length - 1] === (sigHashType & 0xff)
  );
}

/**
 * Whether `signature` is a BIP 340 Schnorr signature committing to the whole transaction: 64 bytes
 * (SIGHASH_DEFAULT), or 65 ending with SIGHASH_ALL. Other sighash types (NONE, SINGLE,
 * ANYONECANPAY) would leave outputs or inputs open to change after signing.
 */
function isSchnorrSignature(signature: Buffer): boolean {
  return signature.length === 64 || (signature.length === 65 && signature[64] === 0x01);
}

/** Whether every input of `transaction` carries a scriptSig or a witness. */
function isSigned(transaction: Transaction): boolean {
  return transaction.ins.every(input => input.script.length > 0 || input.witness.length > 0);
}

/** The script of the output the PSBT's input `index` spends. */
function spentScript(psbt: Psbt, index: number): Buffer {
  const input = psbt.data.inputs[index];
  if (input.witnessUtxo) return Buffer.from(input.witnessUtxo.script);
  if (input.nonWitnessUtxo) {
    const output = Transaction.fromBuffer(input.nonWitnessUtxo).outs[psbt.txInputs[index].index];
    if (output) return Buffer.from(output.script);
  }
  throw new Error(`input ${index} carries no spent output`);
}

/**
 * The signed transaction, from one signature per input: the scriptSig and witness each input type
 * of a single-address account needs (P2PKH, P2SH-P2WPKH, P2WPKH, Taproot key path). The public key
 * is required for every type but Taproot, and must be the one the spent outputs commit to.
 */
function assemble(
  currencyId: string,
  psbt: Psbt,
  signatures: string[],
  publicKey: string | undefined,
): string {
  const sigHashType = getNetworkParameters(currencyId).sigHash;
  const transaction = Transaction.fromBuffer(psbt.data.getTransaction());
  let pubkey: Buffer | undefined;
  const requirePubkey = (): Buffer => {
    if (!publicKey) throw new Error("the public key is required to combine signatures");
    pubkey ??= compressPublicKey(publicKey);
    return pubkey;
  };

  signatures.forEach((hex, index) => {
    const signature = Buffer.from(hex, "hex");
    const script = spentScript(psbt, index);
    const mode = derivationModeOf(script);

    if (mode === DerivationModes.TAPROOT) {
      if (!isSchnorrSignature(signature)) {
        throw new Error(`signature ${index} is not a Schnorr signature of the whole transaction`);
      }
      transaction.setWitness(index, [signature]);
      return;
    }

    if (!isEcdsaSignature(signature, sigHashType)) {
      throw new Error(`signature ${index} is not a signature of this currency's sighash type`);
    }
    const key = requirePubkey();
    if (mode === DerivationModes.LEGACY) {
      if (!sameBytes(payments.p2pkh({ pubkey: key }).output, script)) {
        throw new Error("the public key does not match the spent outputs");
      }
      transaction.ins[index].script = bscript.compile([signature, key]);
      return;
    }
    const witnessProgram = payments.p2wpkh({ pubkey: key }).output;
    if (!witnessProgram) throw new Error("the public key does not match the spent outputs");
    if (mode === DerivationModes.NATIVE_SEGWIT) {
      if (!sameBytes(witnessProgram, script)) {
        throw new Error("the public key does not match the spent outputs");
      }
    } else {
      if (!sameBytes(payments.p2sh({ redeem: { output: witnessProgram } }).output, script)) {
        throw new Error("the public key does not match the spent outputs");
      }
      transaction.ins[index].script = bscript.compile([witnessProgram]);
    }
    transaction.setWitness(index, [signature, key]);
  });
  return transaction.toHex();
}

/**
 * Completes the transaction crafted by `craftTransaction` with what the signer returned, and returns
 * the signed transaction, hex, ready for `broadcast`. The signer returns either:
 *
 * - **the whole signed transaction**, as one element: what hw-app-btc's `createPaymentTransaction`
 *   returns, every Ledger app signing in one session. It must spend exactly the crafted inputs and
 *   pay exactly the crafted outputs, with the crafted version, locktime and sequences. For a signing
 *   request (Komodo, Decred: hw-app-btc serializes the transaction), this is the only form; it is read
 *   in the currency's format and checked field by field against the request.
 * - **one signature per input**, in input order: what a PSBT signer returns (app-bitcoin-new's
 *   `signPsbt`, any BIP 174 signer), small enough for any transport. `publicKey` is then the
 *   sender's public key (compressed or not), except for Taproot.
 */
export function combine(
  currencyId: string,
  tx: string,
  signature: string[],
  publicKey?: string,
): string {
  if (signature.length === 0 || !signature.every(value => HEX.test(value))) {
    throw new Error("the signature is not a signed transaction nor input signatures");
  }

  const request = parseSigningRequest(tx);
  if (request) {
    if (signature.length !== 1) {
      throw new Error(`expected one signed transaction, got ${signature.length} value(s)`);
    }
    const [signed] = signature;
    switch (signedRequestMismatch(Buffer.from(signed, "hex"), request)) {
      case "transaction":
        throw new Error("the signed transaction is not the crafted transaction");
      case "outputs":
        throw new Error("the signed transaction does not pay the crafted outputs");
      case "unsigned":
        throw new Error("the transaction is not signed");
    }
    return signed.toLowerCase();
  }

  const psbt = Psbt.fromBase64(tx);
  const signedTransaction = signature.length === 1 ? parseTransaction(signature[0]) : undefined;
  if (signedTransaction) {
    if (!sameTransaction(signedTransaction, psbt)) {
      throw new Error("the signed transaction is not the crafted transaction");
    }
    if (!isSigned(signedTransaction)) {
      throw new Error("the transaction is not signed");
    }
    return signedTransaction.toHex();
  }
  if (signature.length !== psbt.inputCount) {
    throw new Error(
      `expected one signed transaction or ${psbt.inputCount} input signature(s), got ${signature.length} value(s)`,
    );
  }
  return assemble(currencyId, psbt, signature, publicKey);
}
