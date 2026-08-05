import { Address, Blake2b256, Secp256k1, Transaction } from "@vechain/sdk-core";
import type { VechainSDKTransactionBody, VechainSigner } from "@ledgerhq/coin-vechain/types";

/**
 * Generic-adapter (Alpaca) signer contract, mirrors `GetCoinFrameworkAccountBridge`'s expectation:
 * `signTransaction(path, unsignedJson)` receives the JSON-serialized `VechainSDKTransactionBody`
 * that `craftTransaction` produced (see `@ledgerhq/coin-vechain/logic/transaction/craftTransaction`)
 * and must return a hex-encoded 65-byte signature, exactly what `combine` consumes.
 */
export type GenericVechainSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (path: string, unsignedJson: string) => Promise<string>;
};

export type VechainTestAccount = {
  address: string;
  privateKey: Uint8Array;
  bridge: VechainSigner;
  generic: GenericVechainSigner;
};

/**
 * Builds a deterministic in-memory VeChain signer from a raw secp256k1 private key (e.g. one of
 * thor solo's genesis dev accounts, see `thorNode.ts`).
 *
 * - `bridge` implements the legacy `VechainSigner` contract: `signTransaction(path, rawTxHex)`
 *   receives the hex of the unsigned tx's RLP encoding (`VechainSDKTransaction.of(body).encoded`,
 *   see `coin-vechain/bridge/signOperation.ts`), which is bit-identical to the preimage
 *   `Transaction.getTransactionHash()` hashes — Blake2b256 it directly and sign, no need to
 *   reconstruct the `Transaction` object.
 * - `generic` implements the same signing logic against the JSON body string the generic-adapter
 *   strategy hands it (`craftTransaction`'s output), reconstructing the `Transaction` to get the
 *   same signing hash.
 *
 * Both return a 65-byte secp256k1 signature (r ‖ s ‖ recovery) as hex, matching `combine`'s
 * `Buffer.from(signature, "hex")` and `VechainSDKTransaction.of(body, signature)` re-derivation.
 */
export function buildVechainTestSigner(privateKeyHex: string): VechainTestAccount {
  const privateKey = Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex"));
  const address = Address.ofPrivateKey(privateKey).toString();
  const publicKey = Buffer.from(Secp256k1.derivePublicKey(privateKey, false)).toString("hex");

  const bridge: VechainSigner = {
    async getAddress() {
      return { publicKey, address };
    },
    async signTransaction(_path: string, rawTxHex: string) {
      const hash = Blake2b256.of(Buffer.from(rawTxHex, "hex")).bytes;
      const signature = Secp256k1.sign(hash, privateKey);
      return Buffer.from(signature);
    },
  };

  const generic: GenericVechainSigner = {
    async getAddress() {
      return { address, publicKey };
    },
    async signTransaction(_path: string, unsignedJson: string) {
      const body = JSON.parse(unsignedJson) as VechainSDKTransactionBody;
      const tx = Transaction.of(body);
      const signature = Secp256k1.sign(tx.getTransactionHash().bytes, privateKey);
      return Buffer.from(signature).toString("hex");
    },
  };

  return { address, privateKey, bridge, generic };
}
