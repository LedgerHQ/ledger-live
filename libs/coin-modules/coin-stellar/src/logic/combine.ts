import { Transaction as StellarSdkTransaction } from "@stellar/stellar-sdk";

// https://developers.stellar.org/docs/learn/encyclopedia/network-configuration/network-passphrases
// Mainnet
const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";
// Testnet
// const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export function combine(transaction: string, signature: string, publicKey: string): string {
  const unsignedTx = new StellarSdkTransaction(transaction, NETWORK_PASSPHRASE);
  unsignedTx.addSignature(publicKey, signature);
  return unsignedTx.toXDR();
}
