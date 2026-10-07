import * as ecc from "@bitcoinerlab/secp256k1";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Psbt, Transaction, crypto as btcCrypto, initEccLib, payments } from "bitcoinjs-lib";

initEccLib(ecc);

/** A fixed test key: never holds funds. */
export const PRIVATE_KEY = Buffer.alloc(32, 0x11);
export const PUBLIC_KEY = Buffer.from(secp256k1.getPublicKey(PRIVATE_KEY, true));
const X_ONLY = PUBLIC_KEY.subarray(1, 33);

/** Addresses of {@link PUBLIC_KEY} on Bitcoin mainnet, one per account type. */
export const ADDRESSES = {
  legacy: payments.p2pkh({ pubkey: PUBLIC_KEY }).address!,
  segwit: payments.p2sh({ redeem: payments.p2wpkh({ pubkey: PUBLIC_KEY }) }).address!,
  nativeSegwit: payments.p2wpkh({ pubkey: PUBLIC_KEY }).address!,
  taproot: payments.p2tr({ internalPubkey: X_ONLY }).address!,
};

/** A transaction paying `value` to `script` at output 0, standing for a funding transaction. */
export function fundingTransaction(script: Buffer, value: number, salt = 0): Transaction {
  const tx = new Transaction();
  tx.version = 2;
  tx.addInput(Buffer.alloc(32, 0xa0 + salt), 0, 0xffffffff);
  tx.addOutput(script, value);
  return tx;
}

const ecdsaSigner = {
  publicKey: PUBLIC_KEY,
  sign: (hash: Buffer) =>
    Buffer.from(secp256k1.sign(hash, PRIVATE_KEY, { prehash: false }).toBytes("compact")),
};

function taprootSigner() {
  const tweak = btcCrypto.taggedHash("TapTweak", X_ONLY);
  const negated =
    PUBLIC_KEY[0] === 0x03 ? Buffer.from(ecc.privateNegate(PRIVATE_KEY)) : PRIVATE_KEY;
  const tweaked = Buffer.from(ecc.privateAdd(negated, tweak)!);
  return {
    publicKey: Buffer.from(ecc.pointFromScalar(tweaked, true)!),
    signSchnorr: (hash: Buffer) => Buffer.from(ecc.signSchnorr(hash, tweaked)),
    sign: () => {
      throw new Error("ECDSA not used for Taproot");
    },
  };
}

/**
 * Signs a crafted PSBT as a hardware signer would (bitcoinjs as the reference), returning the
 * signed PSBT, the per-input signatures and the reference fully signed transaction.
 */
export function signPsbt(base64: string, taproot = false) {
  const psbt = Psbt.fromBase64(base64);
  psbt.txInputs.forEach((_, index) => {
    if (taproot) {
      psbt.updateInput(index, { tapInternalKey: X_ONLY });
      psbt.signInput(index, taprootSigner());
    } else {
      psbt.signInput(index, ecdsaSigner);
    }
  });
  const signedBase64 = psbt.toBase64();
  const signatures = psbt.data.inputs.map(input =>
    (input.tapKeySig ?? input.partialSig![0].signature).toString("hex"),
  );
  psbt.finalizeAllInputs();
  return { signedBase64, signatures, reference: psbt.extractTransaction().toHex() };
}
