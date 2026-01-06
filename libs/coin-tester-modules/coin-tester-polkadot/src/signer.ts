import { PolkadotAddress, PolkadotSignature, PolkadotSigner } from "@ledgerhq/coin-polkadot/index";
import { Keyring } from "@polkadot/api";
import { hdLedger, encodeAddress, mnemonicGenerate } from "@polkadot/util-crypto";
import { Keypair } from "@polkadot/util-crypto/types";

function getAddress(keyPair: Keypair): Promise<PolkadotAddress> {
  return Promise.resolve({
    address: encodeAddress(keyPair.publicKey, 0),
    pubKey: Buffer.from(keyPair.publicKey).toString("hex"),
    return_code: 0,
  });
}

function signTransaction(keyPair: Keypair, transaction: Buffer): Promise<PolkadotSignature> {
  const keyring = new Keyring().addFromPair(keyPair);
  // keyring.sign() requires Uint8Array, not Buffer (TypeScript 5.6.3 compatibility)
  const transactionUint8Array = new Uint8Array(transaction);
  const signatureBuffer = keyring.sign(transactionUint8Array, { withType: true });
  // Ensure signature is Uint8Array before Buffer.from() (defensive check for TS 5.6.3 compatibility)
  const signatureUint8Array =
    signatureBuffer instanceof Uint8Array ? signatureBuffer : new Uint8Array(signatureBuffer);
  return Promise.resolve({
    signature: Buffer.from(signatureUint8Array).toString("hex"),
    return_code: 0,
  });
}

export async function buildSigner(): Promise<PolkadotSigner> {
  const seed = mnemonicGenerate(24);

  const keyPair = (path: string) => hdLedger(seed, `m/${path}`);

  return {
    getAddress: (path: string) => getAddress(keyPair(path)),
    sign: (path: string, transaction: Uint8Array) =>
      signTransaction(keyPair(path), Buffer.from(transaction)),
  };
}
