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
  return Promise.resolve({
    signature: Buffer.from(keyring.sign(transaction, { withType: true })).toString("hex"),
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
