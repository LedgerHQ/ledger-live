import {
  AccountAuthenticatorEd25519,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  Hex,
  RawTransaction,
  type SimpleTransaction,
  generateSignedTransaction,
} from "@aptos-labs/ts-sdk";

export function combineSignedTransaction(
  txRaw: RawTransaction,
  signature: Ed25519Signature,
  pubkey: Ed25519PublicKey,
): Uint8Array {
  const authenticator = new AccountAuthenticatorEd25519(pubkey, signature);

  return generateSignedTransaction({
    transaction: { rawTransaction: txRaw } as SimpleTransaction,
    senderAuthenticator: authenticator,
  });
}

export function combine(tx: string, signature: string, pubkey?: string) {
  if (!Hex.isValid(tx).valid) {
    throw new Error("tx must be a valid hex value");
  }

  if (!Hex.isValid(signature).valid) {
    throw new Error("signature must be a valid hex value");
  }

  if (pubkey === undefined) {
    throw new Error("account must have a public key");
  }

  if (!Hex.isValid(pubkey).valid) {
    throw new Error("pubkey must be a valid hex value");
  }

  const ed25519Signature = new Ed25519Signature(signature);
  const ed25519PubKey = new Ed25519PublicKey(pubkey);

  const txBytes = Hex.fromHexString(tx).toUint8Array();
  const txRaw = RawTransaction.deserialize(new Deserializer(txBytes));

  const signedTxBytes = combineSignedTransaction(txRaw, ed25519Signature, ed25519PubKey);

  return Hex.fromHexInput(signedTxBytes).toString();
}
