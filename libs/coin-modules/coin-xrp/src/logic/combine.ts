import { decode, encode } from "ripple-binary-codec";
import { JsonObject } from "ripple-binary-codec/dist/types/serialized-type";
import { SignerEntry } from "../types";

type XRPTransaction = JsonObject & {
  Signers?: Array<SignerEntry>;
  TxnSignature?: string;
  SigningPubKey?: string;
};

export function combine(transaction: string, signature: string, publicKey?: string): string {
  const xrplTransaction: XRPTransaction = decode(transaction);

  // Multi sign transactions have an empty SigningPubKey
  // https://xrpl.org/docs/concepts/accounts/multi-signing#sending-multi-signed-transactions
  // https://xrpl.org/docs/tutorials/how-tos/manage-account-settings/send-a-multi-signed-transaction
  if (xrplTransaction.SigningPubKey === "") {
    // Find the signer that still needs a signature. If a publicKey is provided, match it;
    // otherwise take the first signer without a TxnSignature.
    const signerEntry = xrplTransaction.Signers?.find(
      s => s.Signer.TxnSignature === "" && (!publicKey || s.Signer.SigningPubKey === publicKey),
    );

    if (signerEntry) {
      signerEntry.Signer.TxnSignature = signature;
    }

    return encode(xrplTransaction);
  }

  xrplTransaction.TxnSignature = signature;

  if (publicKey && !xrplTransaction.SigningPubKey) {
    xrplTransaction.SigningPubKey = publicKey;
  }

  return encode(xrplTransaction);
}
