import { Networks, Transaction as StellarSdkTransaction } from "@stellar/stellar-sdk";

export function combine(transaction: string, signature: string, publicKey: string): string {
  const unsignedTx = new StellarSdkTransaction(transaction, Networks.PUBLIC);
  unsignedTx.addSignature(publicKey, signature);
  return unsignedTx.toXDR();
}
