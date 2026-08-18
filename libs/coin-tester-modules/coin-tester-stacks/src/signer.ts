import {
  deserializeTransaction,
  getAddressFromPrivateKey,
  privateKeyToPublic,
  publicKeyToHex,
  TransactionSigner,
} from "@stacks/transactions-v7";
import type { StacksSigner } from "@ledgerhq/coin-stacks/types/signer";

// Only the field this signer reads — `SingleSigSpendingCondition` isn't re-exported from the
// package root, and the coin-tester otherwise has no reason to deep-import `dist/authorization`.
type SingleSigSpendingCondition = { signature?: { data: string } };

export type StacksTestAccount = {
  address: string;
  publicKey: string;
  signer: StacksSigner;
};

const OK_RETURN_CODE = 0x9000;

/**
 * Builds an in-memory legacy `StacksSigner` (`showAddressAndPubKey`/`getAddressAndPubKey`/`sign`)
 * from a raw secp256k1 private key — one of Clarinet's own well-known devnet dev accounts (see
 * `settings/Devnet.toml`), no device/Speculos involved. `coin-stacks` (both its legacy bridge and
 * the generic-adapter path) is on `@stacks/transactions@^7.6.0`, so this signer targets the same
 * v7 API `genericSigner.ts` does rather than a separately-pinned older major.
 *
 * Addresses are derived with the `"testnet"` network name: Clarinet's devnet uses the same address
 * version as testnet (`StacksDevnet`/`StacksMocknet extends StacksNetwork` both set
 * `version = TransactionVersion.Testnet`, verified in the installed `@stacks/network@7.x`).
 *
 * `sign` reuses `@stacks/transactions`'s own `TransactionSigner` on the exact serialized unsigned
 * transaction bytes `coin-stacks` hands the signer, rather than reimplementing the Stacks
 * sighash algorithm: `TransactionSigner.signOrigin` computes the same presign hash a device would
 * and mutates `spendingCondition.signature.data` into the 65-byte recoverable-ECDSA hex
 * (`RECOVERABLE_ECDSA_SIG_LENGTH_BYTES`) that `coin-stacks/bridge/signOperation.ts` reads back as
 * `signatureVRS`.
 */
export function buildStacksTestSigner(privateKeyHex: string): StacksTestAccount {
  const address = getAddressFromPrivateKey(privateKeyHex, "testnet");
  const publicKey = publicKeyToHex(privateKeyToPublic(privateKeyHex));

  const getAddressAndPubKey: StacksSigner["getAddressAndPubKey"] = async () => ({
    address,
    publicKey: Buffer.from(publicKey, "hex"),
    returnCode: OK_RETURN_CODE,
    errorMessage: "",
  });

  const signer: StacksSigner = {
    getAddressAndPubKey,
    showAddressAndPubKey: getAddressAndPubKey,
    sign: async (_path: string, message: Buffer) => {
      const tx = deserializeTransaction(message);
      const txSigner = new TransactionSigner(tx);
      txSigner.signOrigin(privateKeyHex);

      // Always a single-sig standard-principal spending condition in this package's scenarios
      // (STX transfers and SIP-010 calls signed by one key) — `MultiSigSpendingCondition` has no
      // `signature` field at all, so this cast is safe for what this signer is ever asked to sign.
      const spendingCondition = tx.auth.spendingCondition as SingleSigSpendingCondition | undefined;
      const signature = spendingCondition?.signature?.data;
      if (!signature) {
        throw new Error("coin-tester-stacks: signOrigin did not produce a signature");
      }

      return {
        signatureVRS: Buffer.from(signature.replace(/^0x/, ""), "hex"),
        postSignHash: Buffer.alloc(0),
        signatureCompact: Buffer.alloc(0),
        signatureDER: Buffer.alloc(0),
        returnCode: OK_RETURN_CODE,
        errorMessage: "",
      };
    },
  };

  return { address, publicKey, signer };
}
