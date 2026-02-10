import {
  AccountAddress,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
  RawTransaction,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account } from "@ledgerhq/types-live";
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { combineSignedTransaction } from "../logic/combine";
import { AptosSigner } from "../types";

export * from "./client";

export async function signTransaction(
  signerContext: SignerContext<AptosSigner>,
  account: Account,
  deviceId: string,
  rawTxn: RawTransaction,
): Promise<Uint8Array> {
  const { freshAddressPath: derivationPath } = account;

  if (!account.xpub) {
    throw Error("Account must have a public signing key");
  }

  const publicKey = Buffer.from(AccountAddress.from(account.xpub).toUint8Array());
  const hash = sha3Hash.create();
  hash.update(publicKey.toString("hex"));
  hash.update("\x00");

  const signingMessage = generateSigningMessageForTransaction({
    rawTransaction: rawTxn,
  } as SimpleTransaction);

  const response = await signerContext(
    deviceId,
    async signer => await signer.signTransaction(derivationPath, Buffer.from(signingMessage)),
  );

  const signature = new Ed25519Signature(response.signature.toString("hex"));
  const pubkey = new Ed25519PublicKey(publicKey.toString("hex"));

  return combineSignedTransaction(rawTxn, signature, pubkey);
}
