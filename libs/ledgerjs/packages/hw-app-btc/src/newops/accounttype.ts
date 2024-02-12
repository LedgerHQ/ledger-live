import { crypto } from "bitcoinjs-lib";
import { pointAddScalar } from "tiny-secp256k1";
import { BufferWriter } from "../buffertools";
import { HASH_SIZE, OP_CHECKSIG, OP_DUP, OP_EQUAL, OP_EQUALVERIFY, OP_HASH160 } from "../constants";
import { hashPublicKey } from "../hashPublicKey";
import { DefaultDescriptorTemplate } from "./policy";
import { PsbtV2 } from "./psbtv2";

export type SpendingCondition = {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  // Possible future extension:
  // witnessScript?: Buffer; // For p2wsh witnessScript
  // tapScript?: {tapPath: Buffer[], script: Buffer} // For taproot
};

export type SpentOutput = { cond: SpendingCondition; amount: Buffer };

/**
 * Encapsulates differences between account types, for example p2wpkh,
 * p2wpkhWrapped, p2tr.
 */
export interface AccountType {
  /**
   * Generates a scriptPubKey (output script) from a list of public keys. If a
   * p2sh redeemScript or a p2wsh witnessScript is needed it will also be set on
   * the returned SpendingCondition.
   *
   * The pubkeys are expected to be 33 byte ecdsa compressed pubkeys.
   */
  spendingCondition(pubkeys: Buffer[]): SpendingCondition;

  /**
   * Populates the psbt with account type-specific data for an input.
   * @param i The index of the input map to populate
   * @param inputTx The full transaction containing the spent output. This may
   * be omitted for taproot.
   * @param spentOutput The amount and spending condition of the spent output
   * @param pubkeys The 33 byte ecdsa compressed public keys involved in the input
   * @param pathElems The paths corresponding to the pubkeys, in same order.
   */
  setInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkeys: Buffer[],
    pathElems: number[][],
  ): void;

  /**
   * Populates the psbt with account type-specific data for an output. This is typically
   * done for change outputs and other outputs that goes to the same account as
   * being spent from.
   * @param i The index of the output map to populate
   * @param cond The spending condition for this output
   * @param pubkeys The 33 byte ecdsa compressed public keys involved in this output
   * @param paths The paths corresponding to the pubkeys, in same order.
   */
  setOwnOutput(i: number, cond: SpendingCondition, pubkeys: Buffer[], paths: number[][]): void;

  /**
   * Returns the descriptor template for this account type. Currently only
   * DefaultDescriptorTemplates are allowed, but that might be changed in the
   * future. See class WalletPolicy for more information on descriptor
   * templates.
   */
  getDescriptorTemplate(): DefaultDescriptorTemplate;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseAccount extends AccountType {}

abstract class BaseAccount implements AccountType {
  constructor(
    protected psbt: PsbtV2,
    protected masterFp: Buffer,
  ) {}
}

/**
 * Superclass for single signature accounts. This will make sure that the pubkey
 * arrays and path arrays in the method arguments contains exactly one element
 * and calls an abstract method to do the actual work.
 */
abstract class SingleKeyAccount extends BaseAccount {
  spendingCondition(pubkeys: Buffer[]): SpendingCondition {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    return this.singleKeyCondition(pubkeys[0]);
  }
  protected abstract singleKeyCondition(pubkey: Buffer): SpendingCondition;

  setInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkeys: Buffer[],
    pathElems: number[][],
  ) {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    if (pathElems.length != 1) {
      throw new Error("Expected single path, got " + pathElems.length);
    }
    this.setSingleKeyInput(i, inputTx, spentOutput, pubkeys[0], pathElems[0]);
  }
  protected abstract setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkey: Buffer,
    path: number[],
  );

  setOwnOutput(i: number, cond: SpendingCondition, pubkeys: Buffer[], paths: number[][]) {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    if (paths.length != 1) {
      throw new Error("Expected single path, got " + paths.length);
    }
    this.setSingleKeyOutput(i, cond, pubkeys[0], paths[0]);
  }
  protected abstract setSingleKeyOutput(
    i: number,
    cond: SpendingCondition,
    pubkey: Buffer,
    path: number[],
  );
}

export class p2pkh extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const pubkeyHash = hashPublicKey(pubkey);
    buf.writeSlice(Buffer.from([OP_DUP, OP_HASH160, HASH_SIZE]));
    buf.writeSlice(pubkeyHash);
    buf.writeSlice(Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG]));
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    _spentOutput: SpentOutput,
    pubkey: Buffer,
    path: number[],
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "pkh(@0)";
  }
}

export class p2tr extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const xonlyPubkey = pubkey.slice(1); // x-only pubkey
    const buf = new BufferWriter();
    const outputKey = this.getTaprootOutputKey(xonlyPubkey);
    buf.writeSlice(Buffer.from([0x51, 32])); // push1, pubkeylen
    buf.writeSlice(outputKey);
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    _inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkey: Buffer,
    path: number[],
  ) {
    const xonly = pubkey.slice(1);
    this.psbt.setInputTapBip32Derivation(i, xonly, [], this.masterFp, path);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.cond.scriptPubKey);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    const xonly = pubkey.slice(1);
    this.psbt.setOutputTapBip32Derivation(i, xonly, [], this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "tr(@0)";
  }

  /*
  The following two functions are copied from wallet-btc and adapted.
  They should be moved to a library to avoid code reuse.
  */
  private hashTapTweak(x: Buffer): Buffer {
    // hash_tag(x) = SHA256(SHA256(tag) || SHA256(tag) || x), see BIP340
    // See https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#specification
    const h = crypto.sha256(Buffer.from("TapTweak", "utf-8"));
    return crypto.sha256(Buffer.concat([h, h, x]));
  }

  /**
   * Calculates a taproot output key from an internal key. This output key will be
   * used as witness program in a taproot output. The internal key is tweaked
   * according to recommendation in BIP341:
   * https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_ref-22-0
   *
   * @param internalPubkey A 32 byte x-only taproot internal key
   * @returns The output key
   */
  getTaprootOutputKey(internalPubkey: Buffer): Buffer {
    if (internalPubkey.length != 32) {
      throw new Error("Expected 32 byte pubkey. Got " + internalPubkey.length);
    }
    // A BIP32 derived key can be converted to a schnorr pubkey by dropping
    // the first byte, which represent the oddness/evenness. In schnorr all
    // pubkeys are even.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion
    const evenEcdsaPubkey = Buffer.concat([Buffer.from([0x02]), internalPubkey]);
    const tweak = this.hashTapTweak(internalPubkey);

    // Q = P + int(hash_TapTweak(bytes(P)))G
    const outputEcdsaKey = Buffer.from(pointAddScalar(evenEcdsaPubkey, tweak));
    // Convert to schnorr.
    const outputSchnorrKey = outputEcdsaKey.slice(1);
    // Create address
    return outputSchnorrKey;
  }
}

export class p2wpkhWrapped extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const redeemScript = this.createRedeemScript(pubkey);
    const scriptHash = hashPublicKey(redeemScript);
    buf.writeSlice(Buffer.from([OP_HASH160, HASH_SIZE]));
    buf.writeSlice(scriptHash);
    buf.writeUInt8(OP_EQUAL);
    return { scriptPubKey: buf.buffer(), redeemScript: redeemScript };
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkey: Buffer,
    path: number[],
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);

    const userSuppliedRedeemScript = spentOutput.cond.redeemScript;
    const expectedRedeemScript = this.createRedeemScript(pubkey);
    if (userSuppliedRedeemScript && !expectedRedeemScript.equals(userSuppliedRedeemScript)) {
      // At what point might a user set the redeemScript on its own?
      throw new Error(`User-supplied redeemScript ${userSuppliedRedeemScript.toString(
        "hex",
      )} doesn't
       match expected ${expectedRedeemScript.toString("hex")} for input ${i}`);
    }
    this.psbt.setInputRedeemScript(i, expectedRedeemScript);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.cond.scriptPubKey);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputRedeemScript(i, cond.redeemScript!);
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "sh(wpkh(@0))";
  }

  private createRedeemScript(pubkey: Buffer): Buffer {
    const pubkeyHash = hashPublicKey(pubkey);
    return Buffer.concat([Buffer.from("0014", "hex"), pubkeyHash]);
  }
}

export class p2wpkh extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const pubkeyHash = hashPublicKey(pubkey);
    buf.writeSlice(Buffer.from([0, HASH_SIZE]));
    buf.writeSlice(pubkeyHash);
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: SpentOutput,
    pubkey: Buffer,
    path: number[],
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.cond.scriptPubKey);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "wpkh(@0)";
  }
}
