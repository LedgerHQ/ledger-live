import {
  Mnemonic,
  Transaction,
  TransactionComputer,
  type UserSecretKey,
} from "@multiversx/sdk-core";
import { generateMnemonic } from "bip39";

/**
 * Local (non-hardware) MultiversX signer for the coin tester — no Speculos, no device.
 * A fresh key is generated at the MultiversX path `m/44'/508'/0'/0'/0'` (ed25519, SLIP-0010).
 *
 * Homogeneous with the other coin-tester signers (e.g. Stellar): it exposes just
 * `getAddress` and `signTransaction`. The legacy bridge's signer shape is adapted
 * from these two methods in `helpers.ts`.
 *
 * The bridge crafts with `options = TX_HASH_SIGN`, so the signed payload is the
 * keccak256 of the serialized transaction. We use sdk-core's `TransactionComputer`
 * (`computeBytesForVerifying`) to derive those bytes, guaranteeing byte-for-byte
 * agreement with the verifier regardless of field ordering.
 */
export type MultiversXSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    transaction: string,
    options?: { derivationMode?: string },
  ): Promise<string>;
};

const transactionComputer = new TransactionComputer();

/** Rebuild a sdk-core Transaction from the JSON string the bridge passes to sign. */
function transactionFromMessage(message: string): Transaction {
  const o = JSON.parse(message) as {
    nonce: number;
    value: string;
    receiver: string;
    sender: string;
    gasPrice: number;
    gasLimit: number;
    data?: string;
    chainID: string;
    version: number;
    options: number;
  };

  return new Transaction({
    nonce: BigInt(o.nonce),
    value: BigInt(o.value),
    receiver: o.receiver,
    sender: o.sender,
    gasPrice: BigInt(o.gasPrice),
    gasLimit: BigInt(o.gasLimit),
    // The bridge already base64-encodes the data field; decode back to raw bytes.
    data: o.data ? new Uint8Array(Buffer.from(o.data, "base64")) : new Uint8Array(),
    chainID: o.chainID,
    version: o.version,
    options: o.options,
  });
}

export async function buildSigner(): Promise<MultiversXSigner> {
  const mnemonic = generateMnemonic();
  const secretKey: UserSecretKey = Mnemonic.fromString(mnemonic).deriveKey(0);
  const publicKey = secretKey.generatePublicKey();

  const addr = publicKey.toAddress();
  const address = addr.bech32();
  const publicKeyHex = addr.toHex();

  return {
    getAddress: async (path: string) => ({ path, address, publicKey: publicKeyHex }),
    signTransaction: async (_path: string, transaction: string) => {
      const tx = transactionFromMessage(transaction);
      const bytesToSign = transactionComputer.computeBytesForVerifying(tx);
      return secretKey.sign(Buffer.from(bytesToSign)).toString("hex");
    },
  };
}
