import { Networks, Transaction as StellarSdkTransaction, xdr } from "@stellar/stellar-sdk";

export function combine(
  transaction: string | xdr.TransactionEnvelope,
  signature: string,
  publicKey: string,
): string {
  const unsignedTx = new StellarSdkTransaction(transaction, Networks.PUBLIC);
  unsignedTx.addSignature(publicKey, signature);
  return unsignedTx.toXDR();
}
