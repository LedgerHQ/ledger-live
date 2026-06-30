import { Signature, type SignatureLike, Transaction } from "ethers";

function prefixHexString(hex: string): string {
  return hex.startsWith("0x") ? hex : "0x" + hex;
}

function normalizeSignatureLike(signature: SignatureLike): SignatureLike {
  if (signature instanceof Signature) {
    return signature;
  }

  if (
    signature &&
    typeof signature === "object" &&
    "r" in signature &&
    "s" in signature &&
    typeof signature.r === "string" &&
    typeof signature.s === "string"
  ) {
    return {
      ...signature,
      r: prefixHexString(signature.r),
      s: prefixHexString(signature.s),
    };
  }

  return signature;
}

/**
 * Combines a serialized (hex string) Ethereum transaction and a signature to generate a signed transaction.
 * Wallet API swap flows pass DMK signer output through this coin-evm boundary, where `r` and `s` are unprefixed.
 * @param tx Serialized unsigned transaction as a hexadecimal string
 * @param signature Hexadecimal signature or any `SignatureLike` (e.g. `{ r, s, v }` returned by the DMK).
 * @returns Signed transaction as a hexadecimal string
 */
export function combine(tx: string | Transaction, signature: string | SignatureLike): string {
  const txObj = typeof tx === "string" ? Transaction.from(prefixHexString(tx)) : tx;
  const sig =
    typeof signature === "string"
      ? Signature.from(prefixHexString(signature))
      : Signature.from(normalizeSignatureLike(signature));

  // Extract only raw fields manually to avoid class instance issues
  const unsignedTx = {
    type: txObj.type,
    to: txObj.to,
    nonce: txObj.nonce,
    gasLimit: txObj.gasLimit,
    gasPrice: txObj.gasPrice,
    maxPriorityFeePerGas: txObj.maxPriorityFeePerGas,
    maxFeePerGas: txObj.maxFeePerGas,
    data: txObj.data,
    value: txObj.value,
    chainId: txObj.chainId,
    accessList: txObj.accessList,
  };

  return Transaction.from({
    ...unsignedTx,
    signature: sig,
  }).serialized;
}
